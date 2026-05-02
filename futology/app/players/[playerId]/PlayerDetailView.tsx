"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, User, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { PlayerComparisonRadar } from "@/components/intelligence/PlayerComparisonRadar";
import { findPlayer } from "@/lib/data/players";
import {
  nearestPlayers,
  playerStatsById,
  toRadar,
} from "@/lib/data/demoPlayerStats";
import { clusterById } from "@/lib/data/playerClusters";
import { predictTransferValue, formatEUR } from "@/lib/ml/transfer";
import { useSession } from "@/lib/store/session";

const W = 320;
const H = 80;

export function PlayerDetailView({ playerId }: { playerId: number }) {
  const player = findPlayer(playerId);
  const stats = playerStatsById(playerId);
  const togglePlayer = useSession((s) => s.togglePlayer);
  const isFollowed = useSession((s) =>
    s.followedPlayers.some((p) => p.id === playerId),
  );

  const valuation = useMemo(
    () => (stats ? predictTransferValue(stats) : null),
    [stats],
  );
  const similar = useMemo(
    () => (stats ? nearestPlayers(stats, 4) : []),
    [stats],
  );
  const formSeries = useMemo(() => buildFormSeries(playerId), [playerId]);

  if (!player || !stats) {
    return (
      <div className="surface p-6 text-center text-sm text-text-secondary">
        Player not found.
      </div>
    );
  }

  const cluster = clusterById(stats.cluster);

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence/players"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Player Pulse
      </Link>

      <Card className="flex items-start gap-4">
        <div
          aria-hidden
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-bg-elevated text-text-secondary"
        >
          <User className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{player.name}</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: `${cluster.color}22`,
                color: cluster.color,
                border: `1px solid ${cluster.color}55`,
              }}
            >
              {cluster.name}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {player.team} · {player.position} · {player.nationality}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            togglePlayer({ id: player.id, name: player.name, team: player.team })
          }
          aria-pressed={isFollowed}
          className={
            isFollowed
              ? "rounded-lg border border-accent/40 bg-accent-muted px-3 py-2 text-sm font-medium text-accent transition-colors"
              : "rounded-lg border border-border-strong px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
          }
        >
          {isFollowed ? "Following" : "Follow"}
        </button>
      </Card>

      <PageHeader
        title="Stats"
        description="Per-90 contributions in current league season."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Goals/90" value={stats.goals.toFixed(2)} />
        <StatTile label="Assists/90" value={stats.assists.toFixed(2)} />
        <StatTile label="xG/90" value={stats.xG.toFixed(2)} />
        <StatTile label="xA/90" value={stats.xA.toFixed(2)} />
        <StatTile label="Key passes/90" value={stats.keyPasses.toFixed(1)} />
        <StatTile label="Pressures/90" value={String(stats.pressures)} />
        <StatTile label="Pass acc." value={`${stats.passAccuracy.toFixed(0)}%`} />
        <StatTile label="Minutes" value={stats.minutesPlayed.toLocaleString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-2 text-sm font-medium">Form (rating last 10 matches)</p>
          <FormChart series={formSeries} />
          <p className="mt-2 text-[11px] text-text-muted">
            Demo signal. Phase 6 cutover sources match-by-match ratings from FBref.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Predicted market value</p>
            <Coins className="h-4 w-4 text-accent" aria-hidden />
          </div>
          {valuation ? (
            <>
              <p className="tabular mt-2 text-3xl font-bold tracking-tight">
                {formatEUR(valuation.predictedValueEur)}
              </p>
              <p className="text-xs text-text-secondary">
                Band {formatEUR(valuation.lowEstimate)} –{" "}
                {formatEUR(valuation.highEstimate)}
              </p>
              <Link
                href="/intelligence/transfer"
                className="mt-3 inline-block text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Open full valuation →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-text-muted">No valuation available.</p>
          )}
        </Card>
      </div>

      <section>
        <PageHeader
          title="Similar players"
          description={`Closest neighbours by playing-style coordinates within ${cluster.name} and adjacent clusters.`}
          action={
            <Link
              href="/intelligence/players"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
            >
              <Users className="h-4 w-4" aria-hidden /> Cluster scatter
            </Link>
          }
        />
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {similar.map((p) => {
            const c = clusterById(p.cluster);
            return (
              <li key={p.playerId}>
                <Link
                  href={`/players/${p.playerId}`}
                  className="surface surface-hover block p-3"
                >
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-[11px] text-text-secondary">
                    {p.team}
                  </p>
                  <p
                    className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
                    style={{ color: c.color }}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.name}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Card>
        <p className="text-sm font-medium">Side-by-side</p>
        <p className="mt-1 text-xs text-text-secondary">
          Showing this player&apos;s six-axis profile. Open the Compare tab on
          Player Pulse to overlay another player.
        </p>
        <div className="mt-3">
          <PlayerComparisonRadar
            homeName={player.name}
            homeStats={toRadar(stats)}
          />
        </div>
      </Card>
    </div>
  );
}

function buildFormSeries(seed: number): number[] {
  let v = (seed * 31415) % 4294967296;
  if (v < 0) v += 4294967296;
  const rnd = () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
  return Array.from({ length: 10 }, () => Number((5.5 + rnd() * 4).toFixed(1)));
}

function FormChart({ series }: { series: number[] }) {
  if (series.length === 0) return null;
  const min = 4;
  const max = 10;
  const span = max - min;
  const cx = (i: number) => (i / (series.length - 1)) * (W - 16) + 8;
  const cy = (v: number) => H - 8 - ((v - min) / span) * (H - 16);

  const path = series
    .map((v, i) => `${i === 0 ? "M" : "L"} ${cx(i).toFixed(2)},${cy(v).toFixed(2)}`)
    .join(" ");
  const areaPath = `${path} L ${cx(series.length - 1).toFixed(2)},${H - 8} L 8,${H - 8} Z`;

  const last = series[series.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Form chart">
        <line x1={8} y1={H / 2} x2={W - 8} y2={H / 2} stroke="#1f1f1f" strokeWidth="0.5" strokeDasharray="2 4" />
        <path d={areaPath} fill="rgba(0,213,99,0.18)" />
        <path d={path} fill="none" stroke="#00D563" strokeWidth="1.6" />
        {series.map((v, i) => (
          <circle key={i} cx={cx(i)} cy={cy(v)} r={2.5} fill="#00D563" />
        ))}
      </svg>
      <p className="mt-1 text-[11px] text-text-muted">
        Latest rating <span className="tabular text-text-primary">{last.toFixed(1)}</span>
      </p>
    </div>
  );
}
