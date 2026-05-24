"""Trained transfer-value regressor (bible §9.4).

Three XGBoost regressors live in one artefact — `median` for the point
estimate, `p10` and `p90` for the confidence band. SHAP's TreeExplainer
runs against the median model and surfaces the top contributions in
EUR. The exponentiation step back to EUR is shared by all three heads.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap

from app.schemas import TransferFactor, TransferValueRequest, TransferValueResponse


# Pretty labels for the SHAP factor strings. Numbers without context are
# noise — `goals_per_90` becomes "Goal-scoring (0.45/90)" so a user
# reading the dashboard knows what the SHAP contribution attaches to.
FEATURE_LABELS: dict[str, str] = {
    "age": "Age curve",
    "goals_per_90": "Goal-scoring",
    "assists_per_90": "Assist-creation",
    "x_g_per_90": "xG quality",
    "x_a_per_90": "xA quality",
    "pass_accuracy": "Pass accuracy",
    "minutes_played": "Minutes played",
    "league_level": "League tier",
    "is_gk": "Goalkeeper prior",
    "is_def": "Defender prior",
    "is_mid": "Midfielder prior",
    "is_fwd": "Forward prior",
}


def _value_label(name: str, raw: float) -> str:
    """Render the raw feature value next to its label."""
    if name == "age":
        return f"({raw:.0f} y/o)"
    if name == "minutes_played":
        return f"({raw:,.0f} min)"
    if name == "pass_accuracy":
        return f"({raw:.0f}%)"
    if name == "league_level":
        return f"(tier {int(raw)})"
    if name.startswith("is_"):
        return "(active)" if raw > 0 else "(inactive)"
    return f"({raw:.2f}/90)"


@dataclass
class TrainedTransferRegressor:
    scaler: Any
    median_model: Any
    p10_model: Any
    p90_model: Any
    explainer: Any  # shap.TreeExplainer
    feature_order: list[str]
    test_mae_eur: float
    band_coverage: float
    n_train: int

    @classmethod
    def load(cls, path: Path) -> "TrainedTransferRegressor":
        artefact = joblib.load(path)
        return cls(
            scaler=artefact["scaler"],
            median_model=artefact["median_model"],
            p10_model=artefact["p10_model"],
            p90_model=artefact["p90_model"],
            explainer=shap.TreeExplainer(artefact["median_model"]),
            feature_order=list(artefact["feature_order"]),
            test_mae_eur=float(artefact["test_mae_eur"]),
            band_coverage=float(artefact["band_coverage"]),
            n_train=int(artefact["n_train"]),
        )

    def _row(self, req: TransferValueRequest) -> pd.DataFrame:
        is_gk = 1.0 if req.position == "GK" else 0.0
        is_def = 1.0 if req.position == "DEF" else 0.0
        is_mid = 1.0 if req.position == "MID" else 0.0
        is_fwd = 1.0 if req.position == "FWD" else 0.0
        values = {
            "age": float(req.age),
            "goals_per_90": req.goals_per_90,
            "assists_per_90": req.assists_per_90,
            "x_g_per_90": req.x_g_per_90,
            "x_a_per_90": req.x_a_per_90,
            "pass_accuracy": req.pass_accuracy,
            "minutes_played": float(req.minutes_played),
            "league_level": float(req.league_level),
            "is_gk": is_gk,
            "is_def": is_def,
            "is_mid": is_mid,
            "is_fwd": is_fwd,
        }
        return pd.DataFrame([[values[c] for c in self.feature_order]], columns=self.feature_order)

    def predict(self, req: TransferValueRequest) -> TransferValueResponse:
        X = self._row(req)
        X_scaled = self.scaler.transform(X)

        # All three heads return log(EUR); expm1 reverses the log1p
        # transform applied during training.
        median_log = float(self.median_model.predict(X_scaled)[0])
        p10_log = float(self.p10_model.predict(X_scaled)[0])
        p90_log = float(self.p90_model.predict(X_scaled)[0])

        median_eur = max(0.0, np.expm1(median_log))
        p10_eur = max(0.0, np.expm1(p10_log))
        p90_eur = max(0.0, np.expm1(p90_log))

        # Quantile heads are trained independently and can disagree
        # with the median in tail regions of the synthetic prior.
        # Enforce `low <= median <= high` so the band is always
        # non-degenerate and well-ordered when surfaced to users.
        if p10_eur > p90_eur:
            p10_eur, p90_eur = p90_eur, p10_eur
        p10_eur = min(p10_eur, median_eur)
        p90_eur = max(p90_eur, median_eur)

        factors = self._shap_factors(X, X_scaled)

        return TransferValueResponse(
            name=req.name,
            predicted_value_eur=int(round(median_eur)),
            low_estimate=int(round(p10_eur)),
            high_estimate=int(round(p90_eur)),
            shap_factors=factors,
        )

    def _shap_factors(self, X_raw: pd.DataFrame, X_scaled: np.ndarray) -> list[TransferFactor]:
        """Top 5 SHAP contributors translated into EUR.

        SHAP values live in log-EUR space because that's the training
        target. The conversion to EUR is local: contribution_eur =
        (exp(baseline + shap_i) - exp(baseline)) — i.e. the marginal
        EUR delta the feature pushes the prediction by.
        """
        try:
            shap_log = self.explainer.shap_values(X_scaled)
        except Exception:
            return []

        arr = np.asarray(shap_log)
        if arr.ndim == 2:
            contribs_log = arr[0]
        else:
            contribs_log = arr

        baseline_log = float(self.explainer.expected_value)
        running_log = baseline_log
        rows: list[tuple[float, str, float]] = []
        for i, name in enumerate(self.feature_order):
            contrib_log = float(contribs_log[i])
            before = running_log
            running_log += contrib_log
            delta_eur = np.expm1(running_log) - np.expm1(before)
            label = FEATURE_LABELS.get(name, name.replace("_", " ").capitalize())
            raw = float(X_raw.iloc[0][name])
            display = f"{label} {_value_label(name, raw)}"
            rows.append((abs(float(delta_eur)), display, float(delta_eur)))

        rows.sort(key=lambda t: t[0], reverse=True)
        return [
            TransferFactor(label=label, contribution=round(delta, 2))
            for _, label, delta in rows[:5]
        ]
