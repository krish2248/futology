import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Designed empty state for "no data yet" surfaces.
 *
 * Required on every page that can render zero results — per design
 * principle #4, empty states are not optional. The optional `action`
 * slot is the recommended single primary CTA per direction in §1.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "surface flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div
          aria-hidden
          className="grid h-12 w-12 place-items-center rounded-full bg-bg-elevated text-text-secondary"
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div>
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
