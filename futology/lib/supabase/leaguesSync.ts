import { isSupabaseConfigured, getSupabaseBrowserClient } from "./client";
import { useSession, type PredictionLeague, type PredictionLeagueMember } from "@/lib/store/session";

function isRealUser(userId: string): boolean {
  return !userId.startsWith("demo_");
}

function db() {
  const s = getSupabaseBrowserClient();
  return s ? (s as any) : null;
}

export async function rehydrateLeagues(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;

  const [ownedResult, memberResult] = await Promise.all([
    s.from("prediction_leagues").select("*").eq("created_by", userId),
    s.from("prediction_league_members")
      .select("league_id")
      .eq("user_id", userId),
  ]);

  const owned = (ownedResult.data as any[]) ?? [];
  const memberLeagueIds: string[] = ((memberResult.data as any[]) ?? []).map((r: any) => r.league_id);
  const allIds = [...new Set([...owned.map((r: any) => r.id), ...memberLeagueIds])];
  if (allIds.length === 0) return;

  const { data: leagueRows } = await s.from("prediction_leagues").select("*").in("id", allIds);
  if (!leagueRows) return;

  const rows = leagueRows as any[];
  const { data: memberRows } = await s.from("prediction_league_members").select("*").in("league_id", allIds);
  const membersByLeague: Record<string, any[]> = {};
  for (const m of (memberRows as any[]) ?? []) {
    (membersByLeague[m.league_id] ??= []).push(m);
  }

  const leagues: PredictionLeague[] = rows.map((r: any) => {
    const ms = membersByLeague[r.id] ?? [];
    return {
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      inviteCode: r.invite_code,
      isPublic: r.is_public,
      createdBy: r.created_by,
      members: ms.map((m: any) => ({
        userId: m.user_id,
        displayName: "",
        totalPoints: m.total_points,
        totalPredictions: m.total_predictions,
        correctPredictions: m.correct_predictions,
        joinedAt: m.joined_at,
      })),
      createdAt: r.created_at,
    };
  });

  useSession.getState().setPredictionLeagues(leagues);
}

export async function syncCreateLeague(
  name: string,
  description: string | undefined,
  isPublic: boolean,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const s = db();
  if (!s) return null;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return null;

  const { data: leagueData, error: leagueError } = await s
    .from("prediction_leagues")
    .insert({ name, description: description ?? null, is_public: isPublic, created_by: userId })
    .select()
    .single();

  if (leagueError || !leagueData) return null;
  const leagueId = (leagueData as any).id;
  const inviteCode = (leagueData as any).invite_code;

  const points = useSession.getState().predictions.reduce((acc, p) => acc + p.pointsEarned, 0);
  const totalPreds = useSession.getState().predictions.length;
  const correctPreds = useSession.getState().predictions.filter((p) => p.pointsEarned > 0).length;

  await s.from("prediction_league_members").insert({
    league_id: leagueId,
    user_id: userId,
    total_points: points,
    total_predictions: totalPreds,
    correct_predictions: correctPreds,
  });

  return inviteCode;
}

export async function syncJoinLeagueByCode(inviteCode: string): Promise<PredictionLeague | null> {
  if (!isSupabaseConfigured()) return null;
  const s = db();
  if (!s) return null;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return null;

  const code = inviteCode.trim().toUpperCase();
  const { data: leagueData } = await s
    .from("prediction_leagues")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (!leagueData) return null;
  const league = leagueData as any;

  const { data: existing } = await s
    .from("prediction_league_members")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", userId);

  if (existing && (existing as any[]).length > 0) {
    const { data: leagueRows } = await s.from("prediction_leagues").select("*").eq("id", league.id);
    const { data: memberRows } = await s.from("prediction_league_members").select("*").eq("league_id", league.id);
    return buildLeague(league, memberRows as any[]);
  }

  const points = useSession.getState().predictions.reduce((acc, p) => acc + p.pointsEarned, 0);
  const totalPreds = useSession.getState().predictions.length;
  const correctPreds = useSession.getState().predictions.filter((p) => p.pointsEarned > 0).length;

  await s.from("prediction_league_members").insert({
    league_id: league.id,
    user_id: userId,
    total_points: points,
    total_predictions: totalPreds,
    correct_predictions: correctPreds,
  });

  const { data: memberRows } = await s.from("prediction_league_members").select("*").eq("league_id", league.id);
  return buildLeague(league, memberRows as any[]);
}

export async function syncLeaveLeague(leagueId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s.from("prediction_league_members").delete().eq("league_id", leagueId).eq("user_id", userId);

  const { data: remaining } = await s.from("prediction_league_members").select("id").eq("league_id", leagueId);
  if (!remaining || (remaining as any[]).length === 0) {
    await s.from("prediction_leagues").delete().eq("id", leagueId);
  }
}

export async function syncRecomputeStats(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  const points = useSession.getState().predictions.reduce((acc, p) => acc + p.pointsEarned, 0);
  const totalPreds = useSession.getState().predictions.length;
  const correctPreds = useSession.getState().predictions.filter((p) => p.pointsEarned > 0).length;

  await s
    .from("prediction_league_members")
    .update({ total_points: points, total_predictions: totalPreds, correct_predictions: correctPreds })
    .eq("user_id", userId);
}

function buildLeague(league: any, members: any[]): PredictionLeague {
  return {
    id: league.id,
    name: league.name,
    description: league.description ?? undefined,
    inviteCode: league.invite_code,
    isPublic: league.is_public,
    createdBy: league.created_by,
    members: (members ?? []).map((m: any) => ({
      userId: m.user_id,
      displayName: "",
      totalPoints: m.total_points,
      totalPredictions: m.total_predictions,
      correctPredictions: m.correct_predictions,
      joinedAt: m.joined_at,
    })),
    createdAt: league.created_at,
  };
}
