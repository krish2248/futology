import { isSupabaseConfigured, getSupabaseBrowserClient } from "./client";
import { useSession, type PollVote } from "@/lib/store/session";

function isRealUser(userId: string): boolean {
  return !userId.startsWith("demo_");
}

function db() {
  const s = getSupabaseBrowserClient();
  return s ? (s as any) : null;
}

export async function rehydratePollVotes(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;

  const { data } = await s
    .from("poll_votes")
    .select("*")
    .eq("user_id", userId);

  if (!data) return;

  const votes: PollVote[] = (data as any[]).map((r: any) => ({
    pollId: r.poll_id,
    optionId: r.option_id,
    votedAt: r.created_at,
  }));

  useSession.getState().setPollVotes(votes);
}

export async function syncVoteInPoll(pollId: string, optionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s.from("poll_votes").upsert(
    { user_id: userId, poll_id: pollId, option_id: optionId },
    { onConflict: "poll_id,user_id" },
  );
}
