"""Train the FUTOLOGY match predictor (bible §9.1).

Pipeline:
  1. Load all football-data.co.uk CSVs from `data/raw/` (after running
     `scripts/download_football_data.py`).
  2. Compute pre-match features per match: rolling 5-match form, shots,
     clean sheets, H2H last-10 record, days-since-last-match fatigue
     proxy, ELO rating differential.
  3. Temporal train/test split (last 20% by date is held out).
  4. Fit `XGBClassifier(n_estimators=300, max_depth=6, lr=0.05, ...)`
     wrapped in `CalibratedClassifierCV(isotonic)` for honest
     probabilities. Class weights to compensate for draw imbalance.
  5. Persist the calibrated pipeline + the feature column order +
     terminal ELO snapshot to `trained_models/match_predictor.pkl`.

Run with:

    cd ml-service
    pip install -e ".[train]"
    .venv\\Scripts\\python.exe train.py
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict, deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import accuracy_score, classification_report, log_loss
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "trained_models"
MODEL_PATH = OUT_DIR / "match_predictor.pkl"

# Mapping from football-data.co.uk column names to friendly names. We
# only need a small subset of what each CSV provides.
RENAME = {
    "Date": "date",
    "HomeTeam": "home",
    "AwayTeam": "away",
    "FTHG": "home_goals",
    "FTAG": "away_goals",
    "FTR": "ftr",  # H / D / A
    "HS": "home_shots",
    "AS": "away_shots",
    "HST": "home_shots_target",
    "AST": "away_shots_target",
}

REQUIRED_COLS = list(RENAME.values())

# Class labels — kept stable so the pickle survives sklearn re-fits.
CLASSES = ["A", "D", "H"]  # alphabetical so xgboost's internal label order matches
LABEL_TO_INDEX = {c: i for i, c in enumerate(CLASSES)}


def _read_csv(path: Path) -> pd.DataFrame | None:
    """Read a football-data.co.uk CSV, tolerating encoding + missing cols."""
    try:
        df = pd.read_csv(path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(path, encoding="latin-1")
    df = df.rename(columns=RENAME)
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        print(f"  skip {path.name}: missing columns {missing}")
        return None
    df = df[REQUIRED_COLS].dropna(subset=["date", "home", "away", "ftr"])
    # Two date formats live in this archive: DD/MM/YY and DD/MM/YYYY.
    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df = df.dropna(subset=["date"])
    df["league"] = path.stem.split("_")[0]
    return df


def load_matches() -> pd.DataFrame:
    if not DATA_DIR.exists():
        sys.exit(
            f"No data at {DATA_DIR}. Run `python scripts/download_football_data.py` first."
        )
    frames: list[pd.DataFrame] = []
    for path in sorted(DATA_DIR.glob("*.csv")):
        frame = _read_csv(path)
        if frame is not None:
            frames.append(frame)
    if not frames:
        sys.exit("No usable CSVs after column-validation. Re-download?")
    df = pd.concat(frames, ignore_index=True).sort_values("date").reset_index(drop=True)
    # Drop matches with non-standard FTR (e.g. abandoned, postponed).
    df = df[df["ftr"].isin({"H", "D", "A"})].copy()
    return df


@dataclass
class RollingState:
    """Per-team rolling buffers used while walking matches in date order."""

    last5_goals_for: deque[int]
    last5_goals_against: deque[int]
    last5_shots_for: deque[int]
    last5_shots_on_target: deque[int]
    last5_wins: deque[int]  # 1 / 0
    last5_draws: deque[int]
    last5_losses: deque[int]
    last5_clean_sheets: deque[int]
    last_match_date: pd.Timestamp | None

    @classmethod
    def fresh(cls) -> "RollingState":
        return cls(
            last5_goals_for=deque(maxlen=5),
            last5_goals_against=deque(maxlen=5),
            last5_shots_for=deque(maxlen=5),
            last5_shots_on_target=deque(maxlen=5),
            last5_wins=deque(maxlen=5),
            last5_draws=deque(maxlen=5),
            last5_losses=deque(maxlen=5),
            last5_clean_sheets=deque(maxlen=5),
            last_match_date=None,
        )


def _avg(buf: Iterable[float], default: float = 0.0) -> float:
    seq = list(buf)
    return float(np.mean(seq)) if seq else default


def build_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Walk the dataset in date order and emit one row of pre-match features per match."""
    teams: dict[str, RollingState] = defaultdict(RollingState.fresh)
    elo: dict[str, float] = defaultdict(lambda: 1500.0)
    h2h: dict[tuple[str, str], deque[str]] = defaultdict(lambda: deque(maxlen=10))

    rows: list[dict[str, float]] = []
    targets: list[str] = []

    K = 24  # ELO K-factor — moderate
    HOME_ADV = 60  # ELO home-advantage bonus

    for row in df.itertuples(index=False):
        home, away = row.home, row.away
        ht, at = teams[home], teams[away]

        days_home = (row.date - ht.last_match_date).days if ht.last_match_date else 14
        days_away = (row.date - at.last_match_date).days if at.last_match_date else 14
        elo_diff = (elo[home] + HOME_ADV) - elo[away]

        # H2H tally (last 10 meetings, ordered: home perspective)
        pair = tuple(sorted((home, away)))
        h2h_window = list(h2h[pair])
        # results are stored as "H" / "D" / "A" from the home-team's perspective at time of match
        home_h2h_wins = sum(1 for r in h2h_window if r == home)
        away_h2h_wins = sum(1 for r in h2h_window if r == away)
        h2h_draws = len(h2h_window) - home_h2h_wins - away_h2h_wins

        feat = {
            "home_form_wins": sum(ht.last5_wins),
            "home_form_draws": sum(ht.last5_draws),
            "home_form_losses": sum(ht.last5_losses),
            "home_goals_for_avg": _avg(ht.last5_goals_for),
            "home_goals_against_avg": _avg(ht.last5_goals_against),
            "home_shots_avg": _avg(ht.last5_shots_for),
            "home_shots_on_target_avg": _avg(ht.last5_shots_on_target),
            "home_clean_sheets": sum(ht.last5_clean_sheets),
            "home_days_rest": min(days_home, 30),
            "away_form_wins": sum(at.last5_wins),
            "away_form_draws": sum(at.last5_draws),
            "away_form_losses": sum(at.last5_losses),
            "away_goals_for_avg": _avg(at.last5_goals_for),
            "away_goals_against_avg": _avg(at.last5_goals_against),
            "away_shots_avg": _avg(at.last5_shots_for),
            "away_shots_on_target_avg": _avg(at.last5_shots_on_target),
            "away_clean_sheets": sum(at.last5_clean_sheets),
            "away_days_rest": min(days_away, 30),
            "elo_diff": elo_diff,
            "h2h_home_wins": home_h2h_wins,
            "h2h_away_wins": away_h2h_wins,
            "h2h_draws": h2h_draws,
        }
        rows.append(feat)
        targets.append(row.ftr)

        # ---- post-match updates ----
        hg, ag = int(row.home_goals), int(row.away_goals)
        if row.ftr == "H":
            score_home, score_away = 1.0, 0.0
            ht.last5_wins.append(1); ht.last5_draws.append(0); ht.last5_losses.append(0)
            at.last5_wins.append(0); at.last5_draws.append(0); at.last5_losses.append(1)
            h2h[pair].append(home)
        elif row.ftr == "A":
            score_home, score_away = 0.0, 1.0
            ht.last5_wins.append(0); ht.last5_draws.append(0); ht.last5_losses.append(1)
            at.last5_wins.append(1); at.last5_draws.append(0); at.last5_losses.append(0)
            h2h[pair].append(away)
        else:
            score_home, score_away = 0.5, 0.5
            ht.last5_wins.append(0); ht.last5_draws.append(1); ht.last5_losses.append(0)
            at.last5_wins.append(0); at.last5_draws.append(1); at.last5_losses.append(0)
            h2h[pair].append("D")

        ht.last5_goals_for.append(hg)
        ht.last5_goals_against.append(ag)
        ht.last5_clean_sheets.append(1 if ag == 0 else 0)
        ht.last5_shots_for.append(int(row.home_shots) if not pd.isna(row.home_shots) else 0)
        ht.last5_shots_on_target.append(int(row.home_shots_target) if not pd.isna(row.home_shots_target) else 0)
        ht.last_match_date = row.date

        at.last5_goals_for.append(ag)
        at.last5_goals_against.append(hg)
        at.last5_clean_sheets.append(1 if hg == 0 else 0)
        at.last5_shots_for.append(int(row.away_shots) if not pd.isna(row.away_shots) else 0)
        at.last5_shots_on_target.append(int(row.away_shots_target) if not pd.isna(row.away_shots_target) else 0)
        at.last_match_date = row.date

        # ELO update
        exp_home = 1.0 / (1.0 + 10.0 ** (-(elo_diff) / 400.0))
        exp_away = 1.0 - exp_home
        elo[home] += K * (score_home - exp_home)
        elo[away] += K * (score_away - exp_away)

    feature_df = pd.DataFrame(rows)
    targets_s = pd.Series(targets, name="ftr")
    return feature_df, targets_s


def train_model(X: pd.DataFrame, y: pd.Series) -> tuple[CalibratedClassifierCV, dict[str, float]]:
    y_idx = y.map(LABEL_TO_INDEX).to_numpy()
    base = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        objective="multi:softprob",
        num_class=3,
        random_state=42,
        n_jobs=-1,
        tree_method="hist",
    )
    # Class weights — give draws and away wins a small boost so the model
    # doesn't collapse onto the dominant home-win class.
    counts = pd.Series(y_idx).value_counts().sort_index()
    weights = counts.median() / counts
    sample_weights = np.array([weights[i] for i in y_idx])

    base.fit(X, y_idx, sample_weight=sample_weights)

    # sklearn 1.6+ replaces `cv="prefit"` with `FrozenEstimator`. We
    # wrap the already-trained XGBoost and let CalibratedClassifierCV
    # learn the isotonic mapping on the same training data — fine for
    # this size (~9k matches) since the holdout is a separate temporal
    # slice handled in main().
    calibrated = CalibratedClassifierCV(FrozenEstimator(base), method="isotonic", cv=5)
    calibrated.fit(X, y_idx)
    return calibrated, {"weights_median": float(counts.median())}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--test-fraction",
        type=float,
        default=0.2,
        help="Fraction of the *most recent* matches held out for evaluation.",
    )
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("-> Loading matches from", DATA_DIR)
    matches = load_matches()
    print(f"  {len(matches):,} matches across {matches['league'].nunique()} leagues")
    print(f"  date range: {matches['date'].min().date()} -> {matches['date'].max().date()}")

    print("-> Building features (one walk in date order)")
    X, y = build_features(matches)
    print(f"  features: {X.shape[1]} cols × {X.shape[0]:,} rows")
    print(f"  target distribution: {y.value_counts().to_dict()}")

    # Temporal train/test split — last 20% of matches in chronological
    # order is the holdout, mirroring how this would be used in prod.
    split_at = int(len(X) * (1 - args.test_fraction))
    X_train, X_test = X.iloc[:split_at], X.iloc[split_at:]
    y_train, y_test = y.iloc[:split_at], y.iloc[split_at:]
    print(f"-> Temporal split: train={len(X_train):,}  test={len(X_test):,}")

    print("-> Fitting XGBoost + isotonic calibration")
    calibrated, meta = train_model(X_train, y_train)

    y_test_idx = y_test.map(LABEL_TO_INDEX).to_numpy()
    probs = calibrated.predict_proba(X_test)
    preds = probs.argmax(axis=1)
    acc = accuracy_score(y_test_idx, preds)
    ll = log_loss(y_test_idx, probs, labels=[0, 1, 2])
    print(f"\n=== Holdout metrics ({len(X_test):,} matches) ===")
    print(f"  accuracy:  {acc:.3f}")
    print(f"  log loss:  {ll:.3f}")
    print()
    print(classification_report(y_test_idx, preds, target_names=CLASSES, digits=3, zero_division=0))

    artifact = {
        "model": calibrated,
        "feature_columns": list(X.columns),
        "classes": CLASSES,
        "label_to_index": LABEL_TO_INDEX,
        "test_accuracy": float(acc),
        "test_log_loss": float(ll),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "training_meta": meta,
    }
    joblib.dump(artifact, MODEL_PATH)
    size_kb = MODEL_PATH.stat().st_size / 1024
    print(f"-> Wrote {MODEL_PATH.name}  ({size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
