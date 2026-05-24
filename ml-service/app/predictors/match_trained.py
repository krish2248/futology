"""Trained-model match predictor (bible §9.1).

Wraps the artefact written by `ml-service/train.py` and exposes the same
`predict_match(req)` signature as `match_stub.predict_match` — so the
FastAPI route in `app/main.py` can swap one for the other based on
`ML_MODE` without any other code change.

v0.3: key factors come from SHAP's TreeExplainer run against the inner
XGBoost classifier (the calibrator's outputs are used for the actual
probabilities). Each top contributor is mapped to a plain-English
template indexed by feature name.

Calling code:
    predictor = TrainedMatchPredictor.load(Path("trained_models/match_predictor.pkl"))
    result = predictor.predict(req)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap

from app.schemas import PredictMatchRequest, PredictMatchResponse, Winner

# When the request doesn't carry any club-form context, fall back to
# neutral midtable averages so the model still has something to score.
# Derived from training-set means; revisit in v0.4 once Phase 2's
# fixture data feeds real per-club form into the predictor.
NEUTRAL_FORM = {
    "form_wins": 2.0,
    "form_draws": 1.0,
    "form_losses": 2.0,
    "goals_for_avg": 1.4,
    "goals_against_avg": 1.3,
    "shots_avg": 12.0,
    "shots_on_target_avg": 4.2,
    "clean_sheets": 1.5,
    "days_rest": 7.0,
}


# Feature → human-readable label, used in the SHAP factor strings.
# Phrasing varies by class index so a positive contribution to "home
# win" reads naturally regardless of which feature drove it.
FEATURE_LABELS: dict[str, str] = {
    "home_form_wins": "home team's recent wins",
    "home_form_draws": "home team's recent draws",
    "home_form_losses": "home team's recent losses",
    "home_goals_for_avg": "home team's goal-scoring rate",
    "home_goals_against_avg": "home team's goals-conceded rate",
    "home_shots_avg": "home team's shot volume",
    "home_shots_on_target_avg": "home team's shots-on-target rate",
    "home_clean_sheets": "home team's clean-sheet streak",
    "home_days_rest": "home team's days of rest",
    "away_form_wins": "away team's recent wins",
    "away_form_draws": "away team's recent draws",
    "away_form_losses": "away team's recent losses",
    "away_goals_for_avg": "away team's goal-scoring rate",
    "away_goals_against_avg": "away team's goals-conceded rate",
    "away_shots_avg": "away team's shot volume",
    "away_shots_on_target_avg": "away team's shots-on-target rate",
    "away_clean_sheets": "away team's clean-sheet streak",
    "away_days_rest": "away team's days of rest",
    "elo_diff": "ELO rating differential",
    "h2h_home_wins": "head-to-head wins for the home side",
    "h2h_away_wins": "head-to-head wins for the away side",
    "h2h_draws": "head-to-head draws",
}


@dataclass
class TrainedMatchPredictor:
    model: Any  # CalibratedClassifierCV
    explainer: Any  # shap.TreeExplainer
    feature_columns: list[str]
    classes: list[str]
    test_accuracy: float
    test_log_loss: float
    n_train: int

    @classmethod
    def load(cls, path: Path) -> TrainedMatchPredictor:
        artifact = joblib.load(path)
        # `base_xgb` is the bare XGBClassifier from the v0.3 artefact.
        # Older v0.2 artefacts didn't carry it — error out clearly so
        # the operator knows to retrain. Cheap signal.
        if "base_xgb" not in artifact:
            raise RuntimeError(
                "Model artefact missing 'base_xgb' — retrain with the v0.3 trainer "
                "(re-run `python train.py`)."
            )
        return cls(
            model=artifact["model"],
            explainer=shap.TreeExplainer(artifact["base_xgb"]),
            feature_columns=artifact["feature_columns"],
            classes=artifact["classes"],
            test_accuracy=float(artifact["test_accuracy"]),
            test_log_loss=float(artifact["test_log_loss"]),
            n_train=int(artifact["n_train"]),
        )

    def _build_row(self, _: PredictMatchRequest) -> pd.DataFrame:
        """Build one inference row from the request, padding with neutral form.

        The wire format intentionally doesn't carry per-club form yet —
        that needs a database of recent matches that lives elsewhere
        (bible §6 `match_form_snapshots` table once Supabase lands, or
        an API-Football fetch in front of this call). For v0.3 we feed
        neutral form on both sides plus a zero ELO differential, so the
        model effectively predicts "two midtable clubs of equal
        strength." That keeps the contract stable; per-club form lands
        without changing the API.
        """
        row: dict[str, float] = {}
        for side in ("home", "away"):
            for key, val in NEUTRAL_FORM.items():
                row[f"{side}_{key}"] = val
        row["elo_diff"] = 0.0
        row["h2h_home_wins"] = 0.0
        row["h2h_away_wins"] = 0.0
        row["h2h_draws"] = 0.0
        return pd.DataFrame([[row[c] for c in self.feature_columns]], columns=self.feature_columns)

    def predict(self, req: PredictMatchRequest) -> PredictMatchResponse:
        X = self._build_row(req)
        probs = self.model.predict_proba(X)[0]
        idx_to_label = {i: c for i, c in enumerate(self.classes)}
        labelled = {idx_to_label[i]: float(p * 100) for i, p in enumerate(probs)}
        home_p = labelled.get("H", 0.0)
        draw_p = labelled.get("D", 0.0)
        away_p = labelled.get("A", 0.0)

        winner: Winner
        if home_p >= max(draw_p, away_p):
            winner = "home"
        elif away_p >= draw_p:
            winner = "away"
        else:
            winner = "draw"

        conf = float(max(home_p, draw_p, away_p))
        if winner == "home":
            score = "2-1" if conf < 55 else "3-1"
        elif winner == "away":
            score = "1-2" if conf < 55 else "1-3"
        else:
            score = "1-1"

        home_name = req.home_short_name or f"Team {req.home_id}"
        away_name = req.away_short_name or f"Team {req.away_id}"

        winner_class_idx = {"home": "H", "draw": "D", "away": "A"}[winner]
        factors = self._shap_factors(X, winner_class_idx, home_name, away_name)

        return PredictMatchResponse(
            home_win_prob=round(home_p, 2),
            draw_prob=round(draw_p, 2),
            away_win_prob=round(away_p, 2),
            predicted_winner=winner,
            confidence=round(conf, 2),
            predicted_score=score,
            key_factors=factors,
        )

    def _shap_factors(
        self,
        X: pd.DataFrame,
        winner_class: str,
        home_name: str,
        away_name: str,
    ) -> list[str]:
        """Top-3 SHAP contributors to the predicted winner's class.

        TreeExplainer.shap_values returns (1, n_features, n_classes) for
        multiclass XGBoost. We take the column for the winning class and
        rank features by absolute contribution, then translate the top 3
        into plain-English strings using `FEATURE_LABELS`.
        """
        try:
            raw = self.explainer.shap_values(X)
        except Exception:
            return [self._fallback_factor(home_name, away_name)]

        # raw shape can be (1, n_features, n_classes) or list-of-arrays
        # depending on the SHAP version. Normalise to a (n_features,)
        # vector for the winning class.
        class_idx = self.classes.index(winner_class)
        if isinstance(raw, list):
            contributions = np.asarray(raw[class_idx])[0]
        else:
            arr = np.asarray(raw)
            if arr.ndim == 3:
                contributions = arr[0, :, class_idx]
            elif arr.ndim == 2:
                contributions = arr[0]
            else:
                contributions = arr

        order = np.argsort(np.abs(contributions))[::-1]
        factors: list[str] = []
        for idx in order:
            if len(factors) >= 3:
                break
            name = self.feature_columns[idx]
            label = FEATURE_LABELS.get(name, name.replace("_", " "))
            contrib = float(contributions[idx])
            direction = "favours" if contrib >= 0 else "argues against"
            target = (
                home_name
                if winner_class == "H"
                else away_name
                if winner_class == "A"
                else "a draw"
            )
            factors.append(
                f"{label.capitalize()} {direction} {target} (SHAP contribution {contrib:+.2f})."
            )
        return factors or [self._fallback_factor(home_name, away_name)]

    @staticmethod
    def _fallback_factor(home_name: str, away_name: str) -> str:
        return (
            f"Top contributors split evenly between {home_name} and {away_name} — "
            "low-conviction call."
        )
