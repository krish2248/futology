import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind class names with conditional logic and intelligent merging.
 *
 * `clsx` flattens conditional class arrays/objects; `twMerge` then resolves
 * conflicting Tailwind classes (e.g. `px-2 px-4` collapses to `px-4`).
 *
 * @example
 * cn("p-2", isActive && "bg-accent", { "text-white": invert })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
