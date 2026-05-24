"""Canonical cluster profiles shared between training, inference, and the
front-end. Mirrors `futology/lib/data/playerClusters.ts` — the same ids
and colours so the same JSON works on either side.

Each profile carries an `ideal` per-90 vector (in the same field order
as `PlayerClusterRequest`) used by `train.py` to (a) seed synthetic
training samples and (b) name the fitted KMeans cluster IDs after fit.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas import ClusterId

# Feature order is locked here so the trainer, the predictor, and the
# request schema all agree on column positions.
FEATURE_ORDER: tuple[str, ...] = (
    "goals",
    "assists",
    "x_g",
    "x_a",
    "key_passes",
    "progressive_passes",
    "progressive_carries",
    "pressures",
    "tackles_plus_interceptions",
    "pass_accuracy",
)


@dataclass(frozen=True)
class ClusterProfile:
    id: ClusterId
    name: str
    color: str
    description: str
    # Per-feature ideal centre (in FEATURE_ORDER). Used both as the
    # synthetic-data prior and as the anchor for the post-fit name match.
    ideal: tuple[float, ...]


# Tuned by inspection of typical per-90 distributions in the top 5
# leagues. Numbers are illustrative — when real FBref data lands the
# trainer should re-derive these from observed centroids and overwrite
# this file as a one-off "lock the names" step.
CLUSTERS: tuple[ClusterProfile, ...] = (
    ClusterProfile(
        id="target-striker",
        name="Target Striker",
        color="#FF6B6B",
        description=(
            "High shot volume, aerial duels, lives in the box. Converts the "
            "chances created by others."
        ),
        #     goals  ass  xG   xA   KP   PP   PC   pr   T+I  PA%
        ideal=(0.65, 0.20, 0.60, 0.18, 1.0, 4.0, 3.0, 8.0, 1.0, 75.0),
    ),
    ClusterProfile(
        id="creative-playmaker",
        name="Creative Playmaker",
        color="#4ECDC4",
        description=(
            "Threads the needle. High key passes, expected assists, dribbles "
            "into the final third."
        ),
        ideal=(0.30, 0.45, 0.25, 0.45, 3.0, 8.0, 5.0, 14.0, 2.5, 84.0),
    ),
    ClusterProfile(
        id="box-to-box",
        name="Box-to-Box Midfielder",
        color="#45B7D1",
        description=(
            "Engine in the middle of the park. Pressures defenders, carries "
            "forward, recycles possession."
        ),
        ideal=(0.18, 0.20, 0.18, 0.20, 1.6, 7.5, 6.0, 22.0, 5.0, 86.0),
    ),
    ClusterProfile(
        id="ball-playing-defender",
        name="Ball-Playing Defender",
        color="#96CEB4",
        description=(
            "Composed in possession. Initiates attacks with progressive "
            "passes and aerial dominance."
        ),
        ideal=(0.05, 0.06, 0.08, 0.05, 0.5, 9.5, 3.0, 12.0, 4.5, 90.0),
    ),
    ClusterProfile(
        id="high-press-forward",
        name="High Press Forward",
        color="#FFEAA7",
        description=(
            "Defends from the front. High pressures and recoveries in the "
            "opposition half."
        ),
        ideal=(0.38, 0.22, 0.40, 0.22, 1.4, 4.5, 4.5, 24.0, 2.0, 78.0),
    ),
    ClusterProfile(
        id="deep-lying-playmaker",
        name="Deep-Lying Playmaker",
        color="#DDA0DD",
        description=(
            "Conducts from deep. High pass volume and switches of play, low "
            "shot volume."
        ),
        ideal=(0.06, 0.18, 0.07, 0.20, 1.8, 11.0, 3.5, 10.0, 4.0, 91.0),
    ),
)


def get_cluster(cluster_id: ClusterId) -> ClusterProfile:
    for c in CLUSTERS:
        if c.id == cluster_id:
            return c
    raise KeyError(f"Unknown cluster id: {cluster_id}")
