import {
  Home,
  Trophy,
  Target,
  Brain,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const startsWith = (prefix: string) => (pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/scores", label: "Scores", icon: Trophy, match: startsWith("/scores") },
  { href: "/predictions", label: "Predict", icon: Target, match: startsWith("/predictions") },
  { href: "/intelligence", label: "Intel", icon: Brain, match: startsWith("/intelligence") },
  { href: "/profile", label: "Profile", icon: User, match: startsWith("/profile") },
] as const;

export const SECONDARY_NAV: readonly { href: string; label: string }[] = [
  { href: "/clubs", label: "Clubs" },
  { href: "/leagues", label: "Leagues" },
  { href: "/tournaments", label: "Tournaments" },
] as const;
