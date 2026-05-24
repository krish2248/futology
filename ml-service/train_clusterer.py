"""Fit the FUTOLOGY player clusterer (bible §9.2).

Pipeline:
  1. Generate `SAMPLES_PER_CLUSTER` synthetic per-90 stat lines around
     each of the 6 bible-defined profile centroids. Real FBref pulls
     replace this in v0.5; the synthetic prior keeps the cluster names
     stable across re-fits so the front-end's colour map stays valid.
  2. `StandardScaler -> KMeans(n_clusters=6) -> PCA(n_components=2)`.
  3. Map each KMeans label (0-5) to a bible cluster id via greedy
     nearest-centroid assignment in the original (unscaled) space.
  4. Persist scaler + kmeans + pca + label-to-cluster map to
     `trained_models/player_clusterer.pkl`.

Run with:

    cd ml-service
    pip install -e ".[train]"
    .venv\\Scripts\\python.exe train_clusterer.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from app.cluster_profiles import CLUSTERS, FEATURE_ORDER

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "trained_models"
MODEL_PATH = OUT_DIR / "player_clusterer.pkl"

SAMPLES_PER_CLUSTER = 60
RANDOM_STATE = 42
# Per-feature standard deviation expressed as a fraction of each
# feature's typical scale; small enough that clusters stay separable but
# large enough that boundary cases exist.
NOISE_FRACTION = 0.18


def generate_synthetic(rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    """Return (X, y) where y is the *true* cluster id (string) per row."""
    rows: list[np.ndarray] = []
    labels: list[str] = []
    for profile in CLUSTERS:
        centre = np.asarray(profile.ideal, dtype=float)
        spread = np.maximum(np.abs(centre) * NOISE_FRACTION, 0.05)
        samples = rng.normal(loc=centre, scale=spread, size=(SAMPLES_PER_CLUSTER, len(centre)))
        # Clip to non-negative, and cap pass accuracy at 100.
        samples = np.clip(samples, a_min=0.0, a_max=None)
        samples[:, FEATURE_ORDER.index("pass_accuracy")] = np.clip(
            samples[:, FEATURE_ORDER.index("pass_accuracy")], 0.0, 100.0
        )
        rows.append(samples)
        labels.extend([profile.id] * SAMPLES_PER_CLUSTER)
    return np.vstack(rows), np.asarray(labels)


def map_labels_to_clusters(
    kmeans: KMeans, scaler: StandardScaler
) -> dict[int, str]:
    """Greedy nearest-centroid match in the original feature space.

    KMeans assigns numeric labels (0-5) in arbitrary order each fit. We
    name them by walking centroids in descending closeness to each
    bible ideal — closest fit goes first so high-similarity profiles
    (e.g. striker vs press-forward) don't both grab the same ideal.
    """
    centroids_unscaled = scaler.inverse_transform(kmeans.cluster_centers_)

    # distance[i, j] = ||centroid_i - ideal_j||
    distances = np.zeros((len(centroids_unscaled), len(CLUSTERS)))
    for i, centroid in enumerate(centroids_unscaled):
        for j, profile in enumerate(CLUSTERS):
            distances[i, j] = np.linalg.norm(centroid - np.asarray(profile.ideal))

    assigned: dict[int, str] = {}
    used_profiles: set[int] = set()
    while len(assigned) < len(CLUSTERS):
        # find minimum across remaining (centroid, profile) pairs
        masked = distances.copy()
        for cluster_idx in assigned:
            masked[cluster_idx, :] = np.inf
        for profile_idx in used_profiles:
            masked[:, profile_idx] = np.inf
        ci, pj = np.unravel_index(masked.argmin(), masked.shape)
        assigned[int(ci)] = CLUSTERS[int(pj)].id
        used_profiles.add(int(pj))

    return assigned


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=SAMPLES_PER_CLUSTER)
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"-> Generating {args.samples * len(CLUSTERS)} synthetic stat lines "
          f"({args.samples} per cluster, {len(FEATURE_ORDER)} features)")
    rng = np.random.default_rng(RANDOM_STATE)
    X, y_true = generate_synthetic(rng)
    print(f"  X shape: {X.shape}")

    print("-> Fitting StandardScaler -> KMeans(6) -> PCA(2)")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=len(CLUSTERS), random_state=RANDOM_STATE, n_init=10)
    kmeans.fit(X_scaled)

    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    coords = pca.fit_transform(X_scaled)

    label_to_cluster = map_labels_to_clusters(kmeans, scaler)
    print("-> KMeans label -> cluster id:")
    for label_id, cluster_id in sorted(label_to_cluster.items()):
        print(f"     {label_id} -> {cluster_id}")

    # Diagnostics
    silhouette = silhouette_score(X_scaled, kmeans.labels_)
    inertia = kmeans.inertia_
    pca_var = float(pca.explained_variance_ratio_.sum())
    print(f"\n=== Diagnostics ===")
    print(f"  silhouette score:        {silhouette:.3f}  (>0.5 is well-separated)")
    print(f"  inertia (within-cluster): {inertia:.1f}")
    print(f"  PCA explained variance:  {pca_var * 100:.1f}%")

    # Sanity check — purity of synthetic labels vs assigned cluster ids
    assigned_ids = np.array([label_to_cluster[label] for label in kmeans.labels_])
    purity = float((assigned_ids == y_true).mean())
    print(f"  synthetic-label purity:  {purity * 100:.1f}%  (sanity check; not a real metric)")

    artefact = {
        "scaler": scaler,
        "kmeans": kmeans,
        "pca": pca,
        "label_to_cluster": label_to_cluster,
        "feature_order": list(FEATURE_ORDER),
        "n_train": int(len(X)),
        "silhouette": float(silhouette),
        "pca_explained_variance": pca_var,
    }
    joblib.dump(artefact, MODEL_PATH)
    size_kb = MODEL_PATH.stat().st_size / 1024
    print(f"\n-> Wrote {MODEL_PATH.name}  ({size_kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
