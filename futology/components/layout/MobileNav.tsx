"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

const HIDE_NAV_ON = ["/login", "/onboarding"];

/**
 * Fixed bottom-tab navigation, mobile-only (hidden at `md` breakpoint).
 *
 * Each tap target is at least 44px (iOS HIG), respects `safe-area-inset`
 * for devices with home indicators, and uses `active:scale-95` for the
 * tactile press feedback.
 */
export function MobileNav() {
  const pathname = usePathname();
  if (HIDE_NAV_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-primary/95 backdrop-blur-md md:hidden"
    >
      <ul className="safe-bottom container-page grid grid-cols-5 gap-1 pt-2">
        {PRIMARY_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] transition-transform active:scale-95",
                  active ? "text-accent" : "text-text-secondary",
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden
                />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
