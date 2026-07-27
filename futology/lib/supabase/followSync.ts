import { isSupabaseConfigured, getSupabaseBrowserClient } from "./client";
import { useSession, type FollowedLeague, type FollowedClub, type FollowedPlayer, type FollowedTournament } from "@/lib/store/session";

function isRealUser(userId: string): boolean {
  return !userId.startsWith("demo_");
}

function db() {
  const s = getSupabaseBrowserClient();
  return s ? (s as any) : null;
}

export async function rehydrateFollows(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isRealUser(userId)) return;
  const s = db();
  if (!s) return;

  const [{ data: leagues }, { data: clubs }, { data: players }, { data: tournaments }] =
    await Promise.all([
      s.from("user_followed_leagues").select("*").eq("user_id", userId),
      s.from("user_followed_clubs").select("*").eq("user_id", userId),
      s.from("user_followed_players").select("*").eq("user_id", userId),
      s.from("user_followed_tournaments").select("*").eq("user_id", userId),
    ]);

  const store = useSession.getState();

  if (leagues) {
    store.setFollowedLeagues(
      (leagues as any[]).map((r: any) => ({ id: r.league_id, name: r.league_name, country: r.country ?? "", logo: r.league_logo ?? undefined })),
    );
  }
  if (clubs) {
    store.setFollowedClubs(
      (clubs as any[]).map((r: any) => ({ id: r.team_id, name: r.team_name, leagueId: r.league_id ?? undefined, crest: r.team_logo ?? undefined })),
    );
  }
  if (players) {
    store.setFollowedPlayers(
      (players as any[]).map((r: any) => ({ id: r.player_id, name: r.player_name, team: r.team_name ?? undefined, photo: r.player_photo ?? undefined })),
    );
  }
  if (tournaments) {
    store.setFollowedTournaments(
      (tournaments as any[]).map((r: any) => ({ id: r.tournament_id, name: r.tournament_name, logo: r.tournament_logo ?? undefined })),
    );
  }
}

export async function syncFollowLeague(league: FollowedLeague, willBeFollowed: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  if (willBeFollowed) {
    await s.from("user_followed_leagues").upsert(
      { user_id: userId, league_id: league.id, league_name: league.name, country: league.country, league_logo: league.logo ?? null },
      { onConflict: "user_id,league_id" },
    );
  } else {
    await s.from("user_followed_leagues").delete().eq("user_id", userId).eq("league_id", league.id);
  }
}

export async function syncFollowClub(club: FollowedClub, willBeFollowed: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  if (willBeFollowed) {
    await s.from("user_followed_clubs").upsert(
      { user_id: userId, team_id: club.id, team_name: club.name, league_id: club.leagueId ?? null, team_logo: club.crest ?? null },
      { onConflict: "user_id,team_id" },
    );
  } else {
    await s.from("user_followed_clubs").delete().eq("user_id", userId).eq("team_id", club.id);
  }
}

export async function syncFollowPlayer(player: FollowedPlayer, willBeFollowed: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  if (willBeFollowed) {
    await s.from("user_followed_players").upsert(
      { user_id: userId, player_id: player.id, player_name: player.name, team_name: player.team ?? null, player_photo: player.photo ?? null },
      { onConflict: "user_id,player_id" },
    );
  } else {
    await s.from("user_followed_players").delete().eq("user_id", userId).eq("player_id", player.id);
  }
}

export async function syncFollowTournament(tournament: FollowedTournament, willBeFollowed: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  if (willBeFollowed) {
    await s.from("user_followed_tournaments").upsert(
      { user_id: userId, tournament_id: tournament.id, tournament_name: tournament.name, tournament_logo: tournament.logo ?? null },
      { onConflict: "user_id,tournament_id" },
    );
  } else {
    await s.from("user_followed_tournaments").delete().eq("user_id", userId).eq("tournament_id", tournament.id);
  }
}
