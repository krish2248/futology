"""Download football-data.co.uk season CSVs into `ml-service/data/raw/`.

Idempotent — already-downloaded files are skipped on subsequent runs.
Five league codes × six seasons = 30 small CSVs (~50 KB each), so the
full download is a couple of MB. The site is unauthenticated and free.

Usage:

    cd ml-service
    .venv\\Scripts\\python.exe scripts\\download_football_data.py

Outputs:

    ml-service/data/raw/E0_2425.csv      # EPL 2024-25
    ml-service/data/raw/SP1_2122.csv     # La Liga 2021-22
    ...
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import requests

LEAGUES = {
    "E0": "Premier League",
    "SP1": "La Liga",
    "I1": "Serie A",
    "D1": "Bundesliga",
    "F1": "Ligue 1",
}

# football-data.co.uk season codes — YY of start year + YY of end year.
SEASONS = ["1920", "2021", "2122", "2223", "2324", "2425"]

BASE_URL = "https://www.football-data.co.uk/mmz4281/{season}/{league}.csv"
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"


def download_one(season: str, league: str, force: bool = False) -> Path:
    out = DATA_DIR / f"{league}_{season}.csv"
    if out.exists() and not force:
        return out
    url = BASE_URL.format(season=season, league=league)
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(res.content)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Redownload even if file exists.")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    total = len(LEAGUES) * len(SEASONS)
    done = 0
    for league in LEAGUES:
        for season in SEASONS:
            try:
                path = download_one(season, league, force=args.force)
                done += 1
                size_kb = path.stat().st_size / 1024
                print(f"[{done:>2}/{total}] {league} {season}  {size_kb:>5.0f} KB  -> {path.name}")
            except requests.HTTPError as exc:
                print(f"[skip] {league} {season} — {exc}", file=sys.stderr)
            # Friendly delay so we don't hammer the site.
            time.sleep(0.1)
    print(f"\nDone. {done}/{total} files in {DATA_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
