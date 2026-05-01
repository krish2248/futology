"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Mail,
  Moon,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { Toggle } from "@/components/shared/Toggle";
import {
  NOTIFICATION_LABELS,
  useNotificationPreferences,
  type NotificationKey,
} from "@/lib/store/preferences";
import { useSession } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";

export function SettingsView() {
  const ready = useIsClient();
  const router = useRouter();
  const reset = useSession((s) => s.reset);
  const user = useSession((s) => s.user);
  const notifications = useNotificationPreferences((s) => s.notifications);
  const toggleNotification = useNotificationPreferences((s) => s.toggleNotification);
  const emailEnabled = useNotificationPreferences((s) => s.emailEnabled);
  const setEmailEnabled = useNotificationPreferences((s) => s.setEmailEnabled);

  function handleReset() {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm(
      "This wipes your demo session — followed leagues, predictions, leagues, polls. The seeded public leagues stay. Continue?",
    );
    if (!confirmed) return;
    reset();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Profile
      </Link>
      <PageHeader
        title="Settings"
        description="Notification preferences, theme, account."
      />

      <Card>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-text-secondary" aria-hidden />
          <p className="font-medium">Notifications</p>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {(
            Object.keys(NOTIFICATION_LABELS) as NotificationKey[]
          ).map((key) => {
            const label = NOTIFICATION_LABELS[key];
            return (
              <li
                key={key}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{label.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {label.description}
                  </p>
                </div>
                <Toggle
                  checked={ready ? notifications[key] : true}
                  onChange={() => toggleNotification(key)}
                  label={label.title}
                />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-text-secondary" aria-hidden />
          <p className="font-medium">Email</p>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Resend integration delivers these in Phase 5 cutover. The toggle
              persists locally in the meantime.
            </p>
          </div>
          <Toggle
            checked={ready ? emailEnabled : true}
            onChange={(next) => setEmailEnabled(next)}
            label="Email notifications"
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-text-secondary" aria-hidden />
          <p className="font-medium">Theme</p>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Locked. There&apos;s no light mode and there will not be one.
            </p>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
            Always dark
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-text-primary">
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
          <p className="font-medium">Danger zone</p>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          {ready && user
            ? `Signed in as ${user.email}. Wiping clears your demo session.`
            : "You're not signed in."}
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-live/40 px-3 py-1.5 text-sm text-live transition-colors hover:bg-live/10"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Reset demo session
        </button>
      </Card>
    </div>
  );
}
