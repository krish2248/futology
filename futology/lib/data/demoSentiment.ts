import type { DemoMatch } from "./demoMatches";

export type SentimentPoint = {
  minute: number;
  home: number; // -1..1
  away: number;
};

export type SentimentReaction = {
  id: string;
  minute: number;
  side: "home" | "away" | "neutral";
  emotion: "celebrating" | "frustrated" | "anxious" | "shocked" | "neutral";
  text: string;
  source: "reddit" | "twitter";
};

export type SentimentSnapshot = {
  match: DemoMatch;
  timeline: SentimentPoint[];
  goalEvents: { minute: number; team: "home" | "away"; player: string }[];
  excitement: number; // 0..1
  homeMood: number;
  awayMood: number;
  totalPosts: number;
  peakMinute: number;
  biggestSwing: { minute: number; magnitude: number; team: "home" | "away" };
  reactions: SentimentReaction[];
};

function seeded(seed: number) {
  let s = (seed * 9301 + 49297) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const REDDIT_SAMPLES_HOME = [
  "GOOOOOAL!!! Get in!",
  "Beautiful counter-attack",
  "Why can't we keep possession ffs",
  "Class finish, top corner",
  "VAR is going to ruin this",
];
const REDDIT_SAMPLES_AWAY = [
  "What a save 😱",
  "We deserve more here",
  "Subs incoming surely",
  "Need someone to take a shot",
  "Booing already? Nah be patient",
];
const NEUTRAL_SAMPLES = [
  "End-to-end stuff right now",
  "Both keepers earning their wages",
  "Slow start, picking up now",
];

const EMOTION_BY_TEXT: Array<{
  match: RegExp;
  emotion: SentimentReaction["emotion"];
}> = [
  { match: /goal|gol|in!!|class/i, emotion: "celebrating" },
  { match: /var|booing|ffs|terrible/i, emotion: "frustrated" },
  { match: /save|need|deserve|why|nah/i, emotion: "anxious" },
];

function emotionFor(text: string): SentimentReaction["emotion"] {
  for (const rule of EMOTION_BY_TEXT) {
    if (rule.match.test(text)) return rule.emotion;
  }
  return "neutral";
}

export function getDemoSentiment(match: DemoMatch): SentimentSnapshot {
  const minute = match.minute ?? 90;
  const finalMinute = match.status === "scheduled" ? 0 : minute;
  const homeGoals = match.homeScore ?? 0;
  const awayGoals = match.awayScore ?? 0;
  const rnd = seeded(match.id * 11);

  // Build a timeline from minute 0 to finalMinute (or 90 if finished). Each
  // minute walks the previous mood by a small amount, with goal jumps.
  const goalEvents: SentimentSnapshot["goalEvents"] = [];
  for (let i = 0; i < homeGoals; i++) {
    goalEvents.push({
      minute: Math.max(2, Math.floor(rnd() * Math.max(1, finalMinute))),
      team: "home",
      player: "Home #" + (10 + Math.floor(rnd() * 11)),
    });
  }
  for (let i = 0; i < awayGoals; i++) {
    goalEvents.push({
      minute: Math.max(2, Math.floor(rnd() * Math.max(1, finalMinute))),
      team: "away",
      player: "Away #" + (10 + Math.floor(rnd() * 11)),
    });
  }
  goalEvents.sort((a, b) => a.minute - b.minute);

  const timeline: SentimentPoint[] = [];
  let home = 0;
  let away = 0;
  const span = Math.max(1, finalMinute);
  let biggestSwing = { minute: 0, magnitude: 0, team: "home" as "home" | "away" };

  for (let m = 0; m <= span; m++) {
    home += (rnd() - 0.5) * 0.08;
    away += (rnd() - 0.5) * 0.08;
    home -= home * 0.02; // mean revert
    away -= away * 0.02;
    for (const g of goalEvents) {
      if (g.minute === m) {
        const swing = 0.5 + rnd() * 0.4;
        if (g.team === "home") {
          home += swing;
          away -= swing * 0.6;
        } else {
          away += swing;
          home -= swing * 0.6;
        }
        const mag = swing;
        if (mag > biggestSwing.magnitude) {
          biggestSwing = { minute: m, magnitude: mag, team: g.team };
        }
      }
    }
    home = Math.max(-1, Math.min(1, home));
    away = Math.max(-1, Math.min(1, away));
    timeline.push({ minute: m, home: Number(home.toFixed(3)), away: Number(away.toFixed(3)) });
  }

  // Reactions — last 6 entries, slide-in animated client-side
  const reactions: SentimentReaction[] = Array.from({ length: 6 }, (_, i) => {
    const r = rnd();
    const side: "home" | "away" | "neutral" =
      r < 0.4 ? "home" : r < 0.8 ? "away" : "neutral";
    const samples =
      side === "home"
        ? REDDIT_SAMPLES_HOME
        : side === "away"
          ? REDDIT_SAMPLES_AWAY
          : NEUTRAL_SAMPLES;
    const text = samples[Math.floor(rnd() * samples.length)];
    return {
      id: `r-${match.id}-${i}`,
      minute: Math.max(0, finalMinute - i * 3),
      side,
      emotion: emotionFor(text),
      text,
      source: "reddit",
    };
  });

  const homeMood = timeline.length
    ? timeline[timeline.length - 1].home
    : 0;
  const awayMood = timeline.length
    ? timeline[timeline.length - 1].away
    : 0;
  const excitement = Math.min(
    1,
    timeline.reduce((acc, t) => acc + Math.abs(t.home) + Math.abs(t.away), 0) /
      Math.max(1, timeline.length * 2),
  );
  const peakMinute = timeline.reduce(
    (acc, t) =>
      Math.abs(t.home) + Math.abs(t.away) >
      Math.abs(timeline[acc].home) + Math.abs(timeline[acc].away)
        ? t.minute
        : acc,
    0,
  );

  return {
    match,
    timeline,
    goalEvents,
    excitement,
    homeMood,
    awayMood,
    totalPosts: 200 + Math.floor(rnd() * 1800),
    peakMinute,
    biggestSwing,
    reactions,
  };
}
