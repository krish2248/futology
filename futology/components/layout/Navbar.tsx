"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/constants/navigation";
import { SearchModal } from "@/components/shared/SearchModal";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { cn } from "@/lib/utils/cn";

const HIDE_NAV_ON = ["/login", "/onboarding"];

/**
 * Sticky desktop top navigation. Hidden on `/login` and `/onboarding`
 * so the auth flow renders edge-to-edge.
 *
 * Owns the keyboard shortcut for the global search modal:
 *   - Cmd/Ctrl + K → toggle SearchModal
 *   - `/` → open SearchModal (when no input is focused)
 */
export function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      } else if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (HIDE_NAV_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <>
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
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-bg-surface px-2.5 text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
            >
              <Search className="h-4 w-4" />
              <span className="hidden text-xs sm:inline">Search</span>
              <kbd className="hidden rounded border border-border bg-bg-primary px-1 py-0.5 text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function isInputFocused(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable === true
  );
}
