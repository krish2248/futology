import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ApiError({ message, onRetry, className }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "surface flex flex-col items-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full bg-bg-elevated text-warning"
      >
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium">Something went wrong</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          {message ??
            "We couldn't load this. Try again in a moment."}
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:border-accent/40"
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Retry
        </button>
      ) : null}
    </div>
  );
}
