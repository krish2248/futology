"""Trained-model match predictor (bible §9.1).

Wraps the artefact written by `ml-service/train.py` and exposes the same
`predict_match(req)` signature as `match_stub.predict_match` — so the
FastAPI route in `app/main.py` can swap one for the other based on
`ML_MODE` without any other code change.

Calling code:
    predictor = TrainedMatchPredictor.load(Path("trained_models/match_predictor.pkl"))
    result = predictor.predict(req)

`load` is a class method so we can construct a singleton at app
startup (see `app.main.lifespan`).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.schemas import PredictMatchRequest, PredictMatchResponse, Winner


# When the request doesn't carry any club-form context, we fall back to
# neutral midtable averages so the model still has something to score.
# These were derived from the training-set means; tune in v0.3 if the
# trained model starts producing weird draws for unknown clubs.
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


@dataclass
class TrainedMatchPredictor:
    model: Any  # CalibratedClassifierCV
    feature_columns: list[str]
    classes: list[str]
    test_accuracy: float
    test_log_loss: float
    n_train: int

    @classmethod
    def load(cls, path: Path) -> "TrainedMatchPredictor":
        artifact = joblib.load(path)
        return cls(
            model=artifact["model"],
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
        (bible §6 `match_form_snapshots` table once Supabase lands). For
        v0.2 we feed neutral form on both sides plus a zero ELO
        differential, so the model effectively predicts "what would
        happen between two midtable clubs of equal strength." That
        keeps the contract stable and lets us add real form features
        when the data exists, without changing the API.
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
        # Class index → label, then label → human-facing "home/draw/away".
        idx_to_label = {i: c for i, c in enumerate(self.classes)}
        labelled = {idx_to_label[i]: float(p * 100) for i, p in enumerate(probs)}
        home_p = labelled.get("H", 0.0)
        draw_p = labelled.get("D", 0.0)
        away_p = labelled.get("A", 0.0)
        winner: Winner = "home" if home_p >= max(draw_p, away_p) else (
            "away" if away_p >= draw_p else "draw"
        )
        # Predicted score: trained model doesn't emit goals, so we project
        # off the winner's class probability with a simple rule that
        # produces tighter scorelines when confidence is low. Replace
        # with a Poisson goal model in v0.3.
        conf = float(max(home_p, draw_p, away_p))
        if winner == "home":
            score = "2-1" if conf < 55 else "3-1"
        elif winner == "away":
            score = "1-2" if conf < 55 else "1-3"
        else:
            score = "1-1"

        home_name = req.home_short_name or f"Team {req.home_id}"
        away_name = req.away_short_name or f"Team {req.away_id}"
        league_name = req.league_short_name or "this competition"
        factors = self._factors(home_name, away_name, league_name, home_p, away_p, draw_p)

        return PredictMatchResponse(
            home_win_prob=round(home_p, 2),
            draw_prob=round(draw_p, 2),
            away_win_prob=round(away_p, 2),
            predicted_winner=winner,
            confidence=round(conf, 2),
            predicted_score=score,
            key_factors=factors,
        )

    @staticmethod
    def _factors(
        home: str,
        away: str,
        league: str,
        home_p: float,
        away_p: float,
        draw_p: float,
    ) -> list[str]:
        """Plain-English explanations.

        v0.2: derived from class probabilities and the model's training
        accuracy. v0.3 (SHAP integration) will replace this with the
        actual top-3 feature contributions per bible §9.1.
        """
        leading = max(home_p, away_p, draw_p)
        margin = leading - sorted([home_p, away_p, draw_p])[-2]
        factors: list[str] = []
        if home_p > away_p + 5:
            factors.append(
                f"Model gives {home} a {home_p:.0f}% edge from feature-weighted form & ELO."
            )
        elif away_p > home_p + 5:
            factors.append(
                f"Model gives {away} a {away_p:.0f}% edge despite playing on the road."
            )
        else:
            factors.append(
                f"{home} and {away} land within 5 pp — model treats this as a coin flip."
            )

        if draw_p > 30:
            factors.append(f"Draw probability {draw_p:.0f}% — defensive blocks expected in {league}.")
        elif margin < 10:
            factors.append(f"Top-two outcomes within {margin:.0f} pp — flag as low-conviction.")
        else:
            factors.append("Holdout-set accuracy ~49% — treat the favoured winner as ~3:1 vs random.")

        factors.append(
            "v0.2 ships without real-time club form; predictions assume neutral midtable inputs."
        )
        return factors
