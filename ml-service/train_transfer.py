"""Fit the FUTOLOGY transfer-value regressor (bible §9.4).

Three XGBoost regressors share a single trainer pass:
  - median: default `reg:squarederror` — point estimate
  - p10:    `reg:quantileerror` with quantile_alpha=0.10 — low band
  - p90:    `reg:quantileerror` with quantile_alpha=0.90 — high band

All three train on `log(market_value_eur)`; the predictor exponentiates
on the way out. The 80% confidence band falls straight out of the two
quantile heads without any bootstrap loop.

Synthetic prior: 1,000 players sampled per a position-anchored value
function with controlled noise. Real `transfermarkt` / `understat`
pulls replace this in v0.6 — the schema stays stable so the swap is
one trainer rewrite, not an API change.

Run with:

    cd ml-service
    pip install -e ".[train]"
    .venv\\Scripts\\python.exe train_transfer.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "trained_models"
MODEL_PATH = OUT_DIR / "transfer_value.pkl"

RANDOM_STATE = 42
N_SAMPLES = 1_000

POSITIONS = ("GK", "DEF", "MID", "FWD")

# Position-anchored base value (EUR). Same ladder the front-end stub
# uses (`futology/lib/ml/transfer.ts#POSITION_BASE`).
POSITION_BASE = {"GK": 18_000_000, "DEF": 28_000_000, "MID": 42_000_000, "FWD": 55_000_000}

FEATURE_ORDER: tuple[str, ...] = (
    "age",
    "goals_per_90",
    "assists_per_90",
    "x_g_per_90",
    "x_a_per_90",
    "pass_accuracy",
    "minutes_played",
    "league_level",
    "is_gk",
    "is_def",
    "is_mid",
    "is_fwd",
)


def _synthetic_value(
    position: str,
    age: float,
    goals: float,
    assists: float,
    xg: float,
    xa: float,
    pa: float,
    minutes: float,
    league_level: int,
    rng: np.random.Generator,
) -> float:
    base = POSITION_BASE[position]
    # Per-stat contributions — same scale family as the front-end stub
    # so the regressor learns something plausible.
    contributions = (
        goals * 18_000_000
        + xg * 9_000_000
        + assists * 14_000_000
        + (pa - 80) * 600_000
        + (minutes - 1_500) * 4_000
    )
    # Age curve — peak at 26, drops off either side.
    age_term = -((age - 26) ** 2) * 350_000
    # League prior — elite leagues add value, lower divisions subtract.
    league_term = (3 - league_level) * 5_000_000
    # Multiplicative noise so the log target has additive noise.
    noise_factor = float(rng.normal(loc=1.0, scale=0.20))
    value = (base + contributions + age_term + league_term) * noise_factor
    return max(500_000.0, value)


def generate_synthetic() -> tuple[pd.DataFrame, pd.Series]:
    rng = np.random.default_rng(RANDOM_STATE)
    rows: list[dict[str, float]] = []
    values: list[float] = []
    for _ in range(N_SAMPLES):
        position = POSITIONS[int(rng.integers(0, 4))]
        age = float(np.clip(rng.normal(25.5, 4.0), 16, 39))
        is_fw = position == "FWD"
        is_def = position == "DEF"
        is_gk = position == "GK"
        is_mid = position == "MID"

        # Position-conditioned per-90 stats so the synthetic distribution
        # mirrors what FBref-like data actually looks like.
        if is_fw:
            goals = float(np.clip(rng.normal(0.45, 0.25), 0, 1.5))
            assists = float(np.clip(rng.normal(0.18, 0.12), 0, 1.0))
            xg = float(np.clip(rng.normal(0.42, 0.20), 0, 1.4))
            xa = float(np.clip(rng.normal(0.16, 0.10), 0, 0.8))
            pa = float(np.clip(rng.normal(78, 6), 50, 95))
        elif is_mid:
            goals = float(np.clip(rng.normal(0.15, 0.12), 0, 0.8))
            assists = float(np.clip(rng.normal(0.22, 0.15), 0, 1.0))
            xg = float(np.clip(rng.normal(0.16, 0.10), 0, 0.6))
            xa = float(np.clip(rng.normal(0.20, 0.13), 0, 0.7))
            pa = float(np.clip(rng.normal(86, 4), 65, 98))
        elif is_def:
            goals = float(np.clip(rng.normal(0.06, 0.07), 0, 0.4))
            assists = float(np.clip(rng.normal(0.05, 0.06), 0, 0.3))
            xg = float(np.clip(rng.normal(0.08, 0.06), 0, 0.3))
            xa = float(np.clip(rng.normal(0.05, 0.05), 0, 0.3))
            pa = float(np.clip(rng.normal(89, 4), 70, 99))
        else:  # GK
            goals = 0.0
            assists = float(np.clip(rng.normal(0.02, 0.03), 0, 0.2))
            xg = 0.0
            xa = float(np.clip(rng.normal(0.02, 0.03), 0, 0.2))
            pa = float(np.clip(rng.normal(82, 5), 60, 97))

        minutes = float(np.clip(rng.normal(2_400, 800), 200, 3_400))
        league_level = int(np.clip(rng.integers(1, 6), 1, 5))

        value = _synthetic_value(
            position, age, goals, assists, xg, xa, pa, minutes, league_level, rng
        )

        rows.append(
            {
                "age": age,
                "goals_per_90": goals,
                "assists_per_90": assists,
                "x_g_per_90": xg,
                "x_a_per_90": xa,
                "pass_accuracy": pa,
                "minutes_played": minutes,
                "league_level": league_level,
                "is_gk": 1.0 if is_gk else 0.0,
                "is_def": 1.0 if is_def else 0.0,
                "is_mid": 1.0 if is_mid else 0.0,
                "is_fwd": 1.0 if is_fw else 0.0,
            }
        )
        values.append(value)

    X = pd.DataFrame(rows, columns=list(FEATURE_ORDER))
    y = pd.Series(values, name="market_value_eur")
    return X, y


def _fit_quantile(
    X: np.ndarray, y_log: np.ndarray, alpha: float | None
) -> XGBRegressor:
    """Single XGB regressor — median when alpha is None, quantile otherwise."""
    if alpha is None:
        model = XGBRegressor(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=RANDOM_STATE,
            n_jobs=-1,
            tree_method="hist",
        )
    else:
        model = XGBRegressor(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:quantileerror",
            quantile_alpha=alpha,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            tree_method="hist",
        )
    model.fit(X, y_log)
    return model


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test-fraction", type=float, default=0.2)
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"-> Generating {N_SAMPLES:,} synthetic players (4 positions, 12 features)")
    X, y = generate_synthetic()
    print(f"  X shape: {X.shape}")
    print(f"  value distribution (EUR): median {y.median():,.0f}, "
          f"p10 {y.quantile(0.1):,.0f}, p90 {y.quantile(0.9):,.0f}")

    # Temporal-ish random split (synthetic data has no time order).
    split_at = int(len(X) * (1 - args.test_fraction))
    perm = np.random.default_rng(RANDOM_STATE).permutation(len(X))
    train_idx, test_idx = perm[:split_at], perm[split_at:]
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    print(f"-> Split: train={len(X_train):,} test={len(X_test):,}")

    print("-> Scaling features (StandardScaler)")
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    y_train_log = np.log1p(y_train.to_numpy())

    print("-> Fitting median regressor (reg:squarederror)")
    median_model = _fit_quantile(X_train_s, y_train_log, alpha=None)
    print("-> Fitting p10 quantile regressor")
    p10_model = _fit_quantile(X_train_s, y_train_log, alpha=0.10)
    print("-> Fitting p90 quantile regressor")
    p90_model = _fit_quantile(X_train_s, y_train_log, alpha=0.90)

    # Holdout metrics in EUR (back-transform from log space)
    median_pred = np.expm1(median_model.predict(X_test_s))
    mae = mean_absolute_error(y_test, median_pred)
    ss_res = ((y_test - median_pred) ** 2).sum()
    ss_tot = ((y_test - y_test.mean()) ** 2).sum()
    r2 = 1 - ss_res / ss_tot
    print()
    print(f"=== Holdout metrics ({len(X_test)} players) ===")
    print(f"  median MAE: EUR {mae:,.0f}")
    print(f"  median R2:  {r2:.3f}")

    # Coverage - how often the true value falls inside [p10, p90]?
    p10_pred = np.expm1(p10_model.predict(X_test_s))
    p90_pred = np.expm1(p90_model.predict(X_test_s))
    coverage = float(((y_test >= p10_pred) & (y_test <= p90_pred)).mean())
    print(f"  [p10, p90] coverage: {coverage * 100:.1f}%  (target ~80%)")

    artefact = {
        "scaler": scaler,
        "median_model": median_model,
        "p10_model": p10_model,
        "p90_model": p90_model,
        "feature_order": list(FEATURE_ORDER),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "test_mae_eur": float(mae),
        "band_coverage": coverage,
    }
    joblib.dump(artefact, MODEL_PATH)
    size_kb = MODEL_PATH.stat().st_size / 1024
    print(f"\n-> Wrote {MODEL_PATH.name}  ({size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
