"use client";

import { useEffect, useState } from "react";
import { fetchAdminStats, type AdminStats } from "@/app/lib/admin-api";

function StatCard({
  label,
  value,
  icon,
  color = "accent",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    accent: "bg-accent/10 text-accent",
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-emerald-500/10 text-emerald-400",
    orange: "bg-orange-500/10 text-orange-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="rounded-xl border border-border bg-card-bg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colorMap[color] ?? colorMap.accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function renderValue(val: unknown, depth = 0): React.ReactNode {
  if (val === null || val === undefined) return <span className="text-muted">—</span>;
  if (typeof val === "boolean")
    return (
      <span className={val ? "text-emerald-400" : "text-red-400"}>
        {val ? "✓ Ya" : "✗ Tidak"}
      </span>
    );
  if (typeof val === "number" || typeof val === "string")
    return <span className="text-foreground">{String(val)}</span>;
  if (Array.isArray(val))
    return (
      <span className="text-muted">[{val.length} item{val.length !== 1 ? "s" : ""}]</span>
    );
  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    return (
      <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-2 py-0.5 text-sm">
            <span className="shrink-0 font-medium text-muted">{k}:</span>
            <span>{renderValue(v, depth + 1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-foreground">{JSON.stringify(val)}</span>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Statistik sistem KomikHub</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card-bg" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {stats && !isLoading && (
        <>
          {/* Quick stats cards — ambil field umum kalau ada */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(stats as Record<string, unknown>).total_manga !== undefined && (
              <StatCard
                label="Total Manga"
                value={String((stats as Record<string, unknown>).total_manga)}
                color="accent"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
            )}
            {(stats as Record<string, unknown>).total_chapters !== undefined && (
              <StatCard
                label="Total Chapter"
                value={String((stats as Record<string, unknown>).total_chapters)}
                color="blue"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            )}
            {(stats as Record<string, unknown>).total_users !== undefined && (
              <StatCard
                label="Total User"
                value={String((stats as Record<string, unknown>).total_users)}
                color="green"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
            )}
            {(stats as Record<string, unknown>).total_pages !== undefined && (
              <StatCard
                label="Total Halaman"
                value={String((stats as Record<string, unknown>).total_pages)}
                color="orange"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            )}
          </div>

          {/* Raw stats — tampilkan semua data dari API */}
          <div className="rounded-xl border border-border bg-card-bg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">Data Lengkap Statistik</h2>
            </div>
            <div className="p-6 text-sm">{renderValue(stats)}</div>
          </div>
        </>
      )}
    </div>
  );
}