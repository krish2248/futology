import { isSupabaseConfigured, getSupabaseBrowserClient } from "./client";
import { useSession, type Prediction } from "@/lib/store/session";

function isRealUser(userId: string): boolean {
  return !userId.startsWith("demo_");
}

function db() {
  const s = getSupabaseBrowserClient();
  return s ? (s as any) : null;
}

export async function rehydratePredictions(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;

  const { data } = await s
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return;

  const predictions: Prediction[] = (data as any[]).map((r: any) => ({
    id: r.id,
    fixtureId: r.fixture_id,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    matchDate: r.match_date,
    predictedHomeScore: r.predicted_home_score ?? 0,
    predictedAwayScore: r.predicted_away_score ?? 0,
    predictedWinner: (r.predicted_winner ?? "draw") as "home" | "draw" | "away",
    actualHomeScore: r.actual_home_score ?? undefined,
    actualAwayScore: r.actual_away_score ?? undefined,
    pointsEarned: r.points_earned,
    isSettled: r.is_settled,
    mlSuggestedWinner: (r.ml_suggested_winner ?? undefined) as "home" | "draw" | "away" | undefined,
    mlConfidence: r.ml_confidence ?? undefined,
    createdAt: r.created_at,
  }));

  useSession.getState().setPredictions(predictions);
}

export async function syncUpsertPrediction(
  fixtureId: number,
  input: {
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictedWinner: string;
    mlSuggestedWinner?: string;
    mlConfidence?: number;
  },
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s.from("predictions").upsert(
    {
      user_id: userId,
      fixture_id: fixtureId,
      home_team: input.homeTeam,
      away_team: input.awayTeam,
      match_date: input.matchDate,
      predicted_home_score: input.predictedHomeScore,
      predicted_away_score: input.predictedAwayScore,
      predicted_winner: input.predictedWinner,
      ml_suggested_winner: input.mlSuggestedWinner ?? null,
      ml_confidence: input.mlConfidence ?? null,
    },
    { onConflict: "user_id,fixture_id" },
  );
}

export async function syncDeletePrediction(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s.from("predictions").delete().eq("id", id).eq("user_id", userId);
}

export async function syncSettlePrediction(
  fixtureId: number,
  actualHomeScore: number,
  actualAwayScore: number,
  pointsEarned: number,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s
    .from("predictions")
    .update({
      actual_home_score: actualHomeScore,
      actual_away_score: actualAwayScore,
      points_earned: pointsEarned,
      is_settled: true,
    })
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId);
}
