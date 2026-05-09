import { cn } from "@/lib/utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  elevated?: boolean;
};

/**
 * The standard surface container used across pages.
 *
 * - `elevated` swaps the base background to `.surface-elevated` for cards
 *   that should pop above the default page surface.
 * - `hover` adds the accent ring on hover — opt-in because not every card
 *   is interactive.
 */
export function Card({
  className,
  hover = false,
  elevated = false,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        elevated ? "surface-elevated" : "surface",
        hover && "surface-hover",
        "p-4 md:p-6",
        className,
      )}
      {...rest}
    />
  );
}
