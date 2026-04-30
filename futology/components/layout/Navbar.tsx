"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="container-page flex h-14 items-center gap-6 md:h-16">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
          aria-label="FUTOLOGY home"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-bg-primary"
          >
            <span className="text-sm font-black">F</span>
          </span>
          <span className="hidden sm:inline">FUTOLOGY</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {PRIMARY_NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          {SECONDARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
