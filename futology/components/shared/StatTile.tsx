import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
};

export function StatTile({ label, value, hint, className }: Props) {
  return (
    <div className={cn("surface px-4 py-3", className)}>
      <p className="text-[11px] uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <p className="tabular mt-1 text-xl font-semibold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}
