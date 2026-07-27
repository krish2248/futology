import { isSupabaseConfigured, getSupabaseBrowserClient } from "./client";
import { useSession, type AppNotification } from "@/lib/store/session";

function isRealUser(userId: string): boolean {
  return !userId.startsWith("demo_");
}

function db() {
  const s = getSupabaseBrowserClient();
  return s ? (s as any) : null;
}

export async function rehydrateNotifications(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;

  const { data } = await s
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data) return;

  const notifications: AppNotification[] = (data as any[]).map((r: any) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));

  useSession.getState().setNotifications(notifications);
}

export async function syncAddNotification(
  input: Omit<AppNotification, "id" | "createdAt" | "isRead">,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s.from("notifications").insert({
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: null,
  });
}

export async function syncMarkAllNotificationsRead(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const s = db();
  if (!s) return;
  const userId = useSession.getState().user?.id;
  if (!userId || !isRealUser(userId)) return;

  await s
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

type NotificationCallback = (notification: AppNotification) => void;

export function subscribeToNotifications(
  userId: string,
  onNotification: NotificationCallback,
): (() => void) | null {
  if (!isSupabaseConfigured() || !isRealUser(userId)) return null;
  const s = db();
  if (!s) return null;

  const subscription = s
    .channel("notifications-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        const row = payload.new as any;
        onNotification({
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          isRead: row.is_read ?? false,
          createdAt: row.created_at,
        });
      },
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
