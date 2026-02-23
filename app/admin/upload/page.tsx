"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchUploadHealth, type UploadHealth } from "@/app/lib/upload-api";

const uploadMenus = [
  {
    href: "/admin/upload/single",
    title: "Single Chapter",
    desc: "Upload satu chapter dengan file gambar satu per satu",
    icon: "📄",
    color: "border-blue-500/30 hover:border-blue-500/60",
    badge: "Single",
    badgeColor: "bg-blue-500/10 text-blue-400",
  },
  {
    href: "/admin/upload/bulk",
    title: "Bulk Chapters (ZIP)",
    desc: "Upload banyak chapter sekaligus dari file ZIP",
    icon: "📦",
    color: "border-green-500/30 hover:border-green-500/60",
    badge: "Bulk",
    badgeColor: "bg-green-500/10 text-green-400",
  },
  {
    href: "/admin/upload/bulk-json",
    title: "Bulk JSON + ZIP",
    desc: "Upload dengan metadata JSON + file ZIP",
    icon: "🗂️",
    color: "border-yellow-500/30 hover:border-yellow-500/60",
    badge: "JSON",
    badgeColor: "bg-yellow-500/10 text-yellow-400",
  },
  {
    href: "/admin/upload/multiple-manga",
    title: "Multiple Manga",
    desc: "Upload banyak manga sekaligus dari JSON config + ZIP",
    icon: "📚",
    color: "border-purple-500/30 hover:border-purple-500/60",
    badge: "Multi",
    badgeColor: "bg-purple-500/10 text-purple-400",
  },
  {
    href: "/admin/upload/smart-import",
    title: "Smart Import",
    desc: "Auto-import manga dari ZIP dengan ekstraksi metadata otomatis",
    icon: "✨",
    color: "border-accent/30 hover:border-accent/60",
    badge: "Smart",
    badgeColor: "bg-accent/10 text-accent",
  },
  {
    href: "/admin/upload/validate",
    title: "Validate JSON",
    desc: "Validasi JSON config sebelum upload tanpa melakukan upload",
    icon: "✅",
    color: "border-emerald-500/30 hover:border-emerald-500/60",
    badge: "Validate",
    badgeColor: "bg-emerald-500/10 text-emerald-400",
  },
];

export default function AdminUploadPage() {
  const [health, setHealth] = useState<UploadHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  useEffect(() => {
    fetchUploadHealth()
      .then(setHealth)
      .catch(() => {})
      .finally(() => setIsLoadingHealth(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Upload Center</h1>
        <p className="mt-1 text-sm text-muted">Kelola upload manga dan chapter ke sistem</p>
      </div>

      {isLoadingHealth ? (
        <div className="mb-6 h-24 animate-pulse rounded-xl bg-card-bg border border-border" />
      ) : health ? (
        <div className="mb-6 rounded-xl border border-border bg-card-bg p-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${health.status === "healthy" ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-sm font-semibold text-foreground capitalize">{health.status}</span>
            </div>
            <div className="text-sm text-muted">
              Primary: <span className="font-mono text-foreground">{health.primary_remote}</span>
            </div>
            <div className="text-sm text-muted">
              Backup: <span className="font-mono text-foreground">{health.backup_remotes.join(", ")}</span>
            </div>
            <div className="text-sm text-muted">
              Max size: <span className="font-semibold text-foreground">{health.max_file_size_mb}MB</span>
            </div>
            <div className="text-sm text-muted">
              Thumbnail: <span className="font-semibold text-foreground">
                {(health.thumbnail as Record<string, unknown>).target_size as string} · {(health.thumbnail as Record<string, unknown>).aspect_ratio as string}
              </span>
            </div>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {health.allowed_extensions.map((ext) => (
                <span key={ext} className="rounded bg-border px-2 py-0.5 text-[10px] font-mono text-muted">{ext}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(health.features).map(([key, val]) => (
              <span key={key} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${val ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                {val ? "✓" : "✗"} {key.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uploadMenus.map((menu) => (
          <Link key={menu.href} href={menu.href}
            className={`group rounded-xl border bg-card-bg p-6 transition-all hover:bg-card-hover ${menu.color}`}>
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl">{menu.icon}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${menu.badgeColor}`}>
                {menu.badge}
              </span>
            </div>
            <h3 className="mb-1 font-semibold text-foreground group-hover:text-accent transition-colors">
              {menu.title}
            </h3>
            <p className="text-xs text-muted">{menu.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card-bg p-5">
        <h2 className="mb-3 font-semibold text-foreground">Resume Upload</h2>
        <p className="mb-3 text-sm text-muted">Punya resume token dari upload yang gagal?</p>
        <Link href="/admin/upload/resume"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Resume Upload
        </Link>
      </div>
    </div>
  );
}