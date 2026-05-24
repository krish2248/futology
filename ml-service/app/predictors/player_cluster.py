"""Player-cluster predictor (bible §9.2).

Wraps the artefact written by `ml-service/train_clusterer.py` and
exposes a `predict(req)` method that returns the assigned cluster +
2D PCA coords + confidence — the same shape the front-end's Player
Pulse scatter expects.

Confidence is `1 / (1 + d_self / d_next)` rescaled to 0-100, where
d_self is the player's distance to its assigned centroid and d_next
is the distance to the second-nearest. A clean assignment (d_self
much smaller than d_next) approaches 100; an ambiguous one near a
boundary tends toward 50.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from app.cluster_profiles import CLUSTERS, ClusterProfile, get_cluster
from app.schemas import PlayerClusterRequest, PlayerClusterResponse


@dataclass
class TrainedPlayerClusterer:
    scaler: Any  # StandardScaler
    kmeans: Any  # KMeans
    pca: Any  # PCA
    label_to_cluster: dict[int, str]
    feature_order: list[str]
    silhouette: float
    n_train: int

    @classmethod
    def load(cls, path: Path) -> "TrainedPlayerClusterer":
        artefact = joblib.load(path)
        return cls(
            scaler=artefact["scaler"],
            kmeans=artefact["kmeans"],
            pca=artefact["pca"],
            label_to_cluster={int(k): str(v) for k, v in artefact["label_to_cluster"].items()},
            feature_order=list(artefact["feature_order"]),
            silhouette=float(artefact["silhouette"]),
            n_train=int(artefact["n_train"]),
        )

    def _row(self, req: PlayerClusterRequest) -> np.ndarray:
        # Pydantic stores fields under snake_case names regardless of
        # the camelCase aliases on the wire. Pull them in the canonical
        # feature order so a future field add only needs an update in
        # `app/cluster_profiles.py`.
        values = [getattr(req, name) for name in self.feature_order]
        return np.asarray([values], dtype=float)

    def predict(self, req: PlayerClusterRequest) -> PlayerClusterResponse:
        X = self._row(req)
        X_scaled = self.scaler.transform(X)

        # KMeans.transform returns distance from each centroid; the
        # nearest one is the assigned label.
        distances = self.kmeans.transform(X_scaled)[0]
        order = np.argsort(distances)
        label = int(order[0])
        d_self = float(distances[label])
        d_next = float(distances[order[1]])

        cluster_id = self.label_to_cluster[label]
        profile: ClusterProfile = get_cluster(cluster_id)

        # Confidence: when d_self is much smaller than d_next, the
        # assignment is decisive. ratio in [0, 1] -> percent.
        if d_self + d_next < 1e-9:
            confidence = 100.0
        else:
            ratio = d_next / (d_self + d_next)
            confidence = round(float(ratio) * 100.0, 2)

        # PCA xy in the same 2D plane the synthetic training set
        # occupies — front-end scatter can plot directly.
        pca_xy = self.pca.transform(X_scaled)[0]

        return PlayerClusterResponse(
            name=req.name,
            cluster_id=profile.id,
            cluster_name=profile.name,
            color=profile.color,
            pca_x=round(float(pca_xy[0]), 4),
            pca_y=round(float(pca_xy[1]), 4),
            confidence=confidence,
        )


def list_profiles() -> list[dict[str, str]]:
    """Public profile catalogue — used by GET /cluster-profiles so the
    front-end can render the legend without round-tripping a prediction."""
    return [
        {
            "id": c.id,
            "name": c.name,
            "color": c.color,
            "description": c.description,
        }
        for c in CLUSTERS
    ]
