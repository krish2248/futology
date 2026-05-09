import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Standard page-level h1 + subtitle + optional trailing action slot.
 * Used on every top-level route to keep title typography and spacing
 * consistent across pages.
 */
export function PageHeader({ title, description, action, className }: Props) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
