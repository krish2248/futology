"""Sentiment snapshot generator (bible §9.3).

v0.6a — deterministic seeded synthetic timeline + reaction sampler. The
RNG seed comes from `fixture_id`, so the same fixture always emits the
same snapshot (useful in demos and in CI). The wire format is designed
to match a future Reddit+RoBERTa implementation 1:1 so the swap is one
function replacement, not an API change.

Real-source roadmap:
  - Add `ML_SOCIAL_PROVIDER=reddit` (env) with `REDDIT_*` creds.
  - Pull match thread via PRAW, batch-infer
    `cardiffnlp/twitter-roberta-base-sentiment-latest` per bible §9.3.
  - Persist 60s snapshots to `match_sentiment_snapshots` (Supabase).
  - This module's `predict` signature stays identical; only the
    `_collect_reactions` impl changes.
"""

from __future__ import annotations

import math

from app.schemas import (
    Emotion,
    SentimentPoint,
    SentimentReaction,
    SentimentRequest,
    SentimentResponse,
    Side,
    SocialSource,
)


def _seeded(seed: int):
    """Lehmer RNG — same recipe as `match_stub` and `predictor.ts`."""
    s = seed % 4_294_967_296
    if s < 0:
        s += 4_294_967_296

    def _next() -> float:
        nonlocal s
        s = (s * 1_664_525 + 1_013_904_223) % 4_294_967_296
        return s / 4_294_967_296

    return _next


# Templated reactions parametrised by side + emotion. The synthetic
# sampler picks one per slot; the Reddit-real implementation will
# replace these with cleaned-up real comments.
TEMPLATES: dict[tuple[Side, Emotion], list[str]] = {
    ("home", "celebrating"): [
        "Get in! Stunning finish from {home}.",
        "Vintage {home} — we're cooking.",
        "{home} look unplayable today.",
    ],
    ("home", "frustrated"): [
        "{home} can't string two passes together right now.",
        "Same old {home}, all the possession, none of the bite.",
        "Where is the urgency from {home}?!",
    ],
    ("home", "anxious"): [
        "{home} need to settle, they're inviting pressure.",
        "If {home} concede here it's curtains.",
        "Long way to go but {home} look nervous.",
    ],
    ("home", "shocked"): [
        "Did {home} actually try that?!",
        "How did {home} miss that?",
        "Unreal — {home} just gifted them a chance.",
    ],
    ("away", "celebrating"): [
        "{away} are tearing this place apart!",
        "Massive away day shaping up for {away}.",
        "Quality from {away}, they're running the show.",
    ],
    ("away", "frustrated"): [
        "{away} are wasteful in the final third.",
        "Same story for {away} — chances created, chances spurned.",
        "Where's the cutting edge for {away}?",
    ],
    ("away", "anxious"): [
        "{away} need to weather this storm.",
        "Don't fancy our chances if {away} keep this up.",
        "Long road back for {away} from here.",
    ],
    ("away", "shocked"): [
        "What was {away} doing there?!",
        "{away} can't believe they conceded that.",
        "Stunning lapse from {away}.",
    ],
    ("neutral", "neutral"): [
        "{league} on top form tonight.",
        "Cracking advert for {league}, this.",
        "Both sides toe-to-toe — proper game.",
    ],
}


def _emotion_for(side: Side, sentiment: float, rnd) -> Emotion:
    """Map (side, sentiment) to one of the bible's 5 emotion buckets."""
    if side == "neutral":
        return "neutral"
    abs_s = abs(sentiment)
    if abs_s < 0.15:
        return "anxious" if rnd() < 0.5 else "neutral"
    if sentiment > 0.55:
        return "celebrating"
    if sentiment > 0.2:
        return "anxious" if rnd() < 0.3 else "celebrating"
    if sentiment > -0.2:
        return "anxious"
    if sentiment > -0.55:
        return "frustrated"
    return "shocked"


def _build_timeline(req: SentimentRequest, rnd) -> list[SentimentPoint]:
    """Per-minute home/away sentiment with smooth drift + score-event jolts.

    Goals (synthesised proportionally to score) jolt the scoring team
    up ~0.7 and the conceding team down ~0.5 — same magnitudes the
    front-end's demoSentiment uses.
    """
    home_score = req.home_score
    away_score = req.away_score
    total_minutes = max(req.minute, 1)

    # Distribute goals roughly evenly across the played minutes.
    def goal_minutes(count: int) -> list[int]:
        if count <= 0:
            return []
        gap = total_minutes / (count + 1)
        return [int(gap * (i + 1)) for i in range(count)]

    home_goals = goal_minutes(home_score)
    away_goals = goal_minutes(away_score)

    # Drift around 0 with small noise per minute; jolt on goal minutes.
    points: list[SentimentPoint] = []
    h = 0.0
    a = 0.0
    for m in range(total_minutes + 1):
        # Decay back toward 0 each minute (mean-reverting walk).
        h *= 0.92
        a *= 0.92
        h += (rnd() - 0.5) * 0.18
        a += (rnd() - 0.5) * 0.18
        if m in home_goals:
            h = min(1.0, h + 0.72)
            a = max(-1.0, a - 0.55)
        if m in away_goals:
            a = min(1.0, a + 0.72)
            h = max(-1.0, h - 0.55)
        # Clamp into [-1, 1].
        h = max(-1.0, min(1.0, h))
        a = max(-1.0, min(1.0, a))
        points.append(SentimentPoint(minute=m, home=round(h, 3), away=round(a, 3)))
    return points


def _biggest_swing(timeline: list[SentimentPoint]) -> tuple[int, float, Side]:
    """Window of size 3 over each side's sentiment, return the largest delta."""
    best_minute = 0
    best_magnitude = 0.0
    best_side: Side = "home"
    for window in range(3, len(timeline)):
        for side in ("home", "away"):
            now = getattr(timeline[window], side)
            then = getattr(timeline[window - 3], side)
            delta = abs(now - then)
            if delta > best_magnitude:
                best_magnitude = delta
                best_minute = timeline[window].minute
                best_side = side  # type: ignore[assignment]
    return best_minute, round(best_magnitude, 3), best_side


def _collect_reactions(
    req: SentimentRequest, timeline: list[SentimentPoint], rnd
) -> list[SentimentReaction]:
    """Sample `n_reactions` synthetic reactions across the timeline.

    Real-Reddit replacement plugs in here — same return shape, same
    contract. Source label switches from `"synthetic"` to `"reddit"`.
    """
    source: SocialSource = "synthetic"
    league = req.league_short_name or "the league"

    out: list[SentimentReaction] = []
    for i in range(req.n_reactions):
        # Pick a minute weighted toward the second half — late-match
        # reactions are more concentrated in real data.
        skew = rnd() ** 0.7
        m_idx = int(skew * (len(timeline) - 1))
        point = timeline[m_idx]
        if abs(point.home) > abs(point.away):
            dominant_side: Side = "home"
            dominant_sent = point.home
        else:
            dominant_side = "away"
            dominant_sent = point.away
        # 15% chance the reaction is neutral / about the league.
        if rnd() < 0.15:
            side: Side = "neutral"
            emotion: Emotion = "neutral"
        else:
            side = dominant_side
            emotion = _emotion_for(side, dominant_sent, rnd)
        pool = TEMPLATES.get((side, emotion)) or TEMPLATES[("neutral", "neutral")]
        template = pool[int(rnd() * len(pool))]
        text = template.format(home=req.home_team, away=req.away_team, league=league)
        out.append(
            SentimentReaction(
                id=f"r-{req.fixture_id}-{i}",
                minute=point.minute,
                side=side,
                emotion=emotion,
                text=text,
                source=source,
            )
        )
    return out


def analyze(req: SentimentRequest) -> SentimentResponse:
    """Synthetic deterministic sentiment snapshot. Bible §9.3 wire shape."""
    seed = (
        req.fixture_id * 1_000_003
        + req.minute * 31
        + req.home_score * 7
        + req.away_score
    )
    rnd = _seeded(seed)

    timeline = _build_timeline(req, rnd)
    home_mood = round(sum(p.home for p in timeline) / len(timeline), 3)
    away_mood = round(sum(p.away for p in timeline) / len(timeline), 3)
    excitement = round(
        sum(abs(p.home) + abs(p.away) for p in timeline) / (2 * len(timeline)), 3
    )

    # Peak minute: the slot with the highest absolute sentiment on either side.
    peak_minute = max(timeline, key=lambda p: max(abs(p.home), abs(p.away))).minute
    swing_min, swing_mag, swing_side = _biggest_swing(timeline)

    reactions = _collect_reactions(req, timeline, rnd)
    # Synthetic post count scales with absolute sentiment and minute count.
    # Real Reddit numbers replace this when the swap lands.
    total_posts = int(120 + 40 * math.log1p(len(timeline)) + 200 * excitement)

    return SentimentResponse(
        fixture_id=req.fixture_id,
        home_team=req.home_team,
        away_team=req.away_team,
        home_mood=home_mood,
        away_mood=away_mood,
        excitement=excitement,
        total_posts=total_posts,
        peak_minute=peak_minute,
        biggest_swing_minute=swing_min,
        biggest_swing_magnitude=swing_mag,
        biggest_swing_team=swing_side,
        timeline=timeline,
        reactions=reactions,
        source_mode="synthetic",
    )
