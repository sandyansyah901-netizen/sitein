"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { getReadingStats, getReadingHistory, type ReadingStats, type ReadingHistoryItem } from "@/app/lib/user-api";
import { BookMarked, History, List, Clock, CheckCircle2, BookOpen, TrendingUp } from "lucide-react";
import { mangaHref } from "@/app/lib/utils";

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-xl font-bold text-[#222] dark:text-white">{value}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    );
}

function formatDateTime(dateString: string): string {
    // Backend returns naive UTC timestamps like "2026-02-25T14:15:08"
    // We must append "Z" to force the browser to parse it as UTC, not local time.
    const normalized = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
    const date = new Date(normalized);
    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function DashboardPage() {
    const { user, token, isLoggedIn, isLoading } = useAuth();
    const [stats, setStats] = useState<ReadingStats | null>(null);
    const [recentHistory, setRecentHistory] = useState<ReadingHistoryItem[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!token || !isLoggedIn) return;
        setDataLoading(true);
        Promise.all([
            getReadingStats(token).catch(() => null),
            getReadingHistory(token, 1, 5).catch(() => null),
        ]).then(([s, h]) => {
            if (s) setStats(s);
            if (h) setRecentHistory(h.items);
            setDataLoading(false);
        });
    }, [token, isLoggedIn]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
                Memuat...
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <div className="text-5xl">🔐</div>
                <h2 className="text-lg font-bold text-[#222] dark:text-white">Kamu belum login</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Login dulu untuk melihat dashboard kamu.</p>
                <button
                    onClick={() => document.getElementById("login-btn")?.click()}
                    className="mt-2 rounded-lg bg-[#E50914] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c8000f] transition-colors"
                >
                    Login Sekarang
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile header */}
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-5">
                <div className="relative shrink-0">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-[#E50914]/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-[#E50914] flex items-center justify-center text-white text-2xl font-black select-none">
                            {user?.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-[#222] dark:text-white">{user?.username}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Bergabung {new Date(user?.created_at ?? "").toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                    </p>
                </div>
                <Link
                    href="/dashboard/profile"
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:border-[#E50914]/40 hover:text-[#E50914] transition-colors"
                >
                    Edit Profil
                </Link>
            </div>

            {/* Stats */}
            {dataLoading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-[74px] rounded-xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <StatCard label="Sedang Dibaca" value={stats?.reading_list.reading ?? 0} icon={BookOpen} color="bg-blue-500" />
                    <StatCard label="Selesai" value={stats?.reading_list.completed ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
                    <StatCard label="Bookmarks" value={stats?.total_bookmarks ?? 0} icon={BookMarked} color="bg-[#E50914]" />
                    <StatCard label="Total Dibaca" value={stats?.total_history ?? 0} icon={TrendingUp} color="bg-purple-500" />
                </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Reading History", href: "/dashboard/history", icon: History, desc: "Lanjut baca" },
                    { label: "Bookmarks", href: "/dashboard/bookmarks", icon: BookMarked, desc: "Manga favorit" },
                    { label: "Reading List", href: "/dashboard/lists", icon: List, desc: "Status baca" },
                ].map(({ label, href, icon: Icon, desc }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-4 text-center hover:border-[#E50914]/30 hover:bg-[#E50914]/5 transition-colors group"
                    >
                        <Icon className="w-6 h-6 text-[#E50914]" />
                        <span className="text-[13px] font-semibold text-[#222] dark:text-white">{label}</span>
                        <span className="text-[11px] text-gray-400">{desc}</span>
                    </Link>
                ))}
            </div>

            {/* Recent history */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[14px] font-bold text-[#222] dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#E50914]" /> Terakhir Dibaca
                    </h2>
                    <Link href="/dashboard/history" className="text-[12px] text-[#E50914] hover:underline">
                        Lihat semua →
                    </Link>
                </div>

                {dataLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse" />
                        ))}
                    </div>
                ) : recentHistory.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] py-10 text-center text-sm text-gray-400">
                        Belum ada history baca.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentHistory.map((item) => {
                            const progress = Math.round((item.page_number / item.total_pages) * 100);
                            return (
                                <Link
                                    key={`${item.manga_slug}-${item.chapter_slug}`}
                                    href={mangaHref(item.manga_type_slug, item.manga_slug)}
                                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-3 hover:border-[#E50914]/30 transition-colors group"
                                >
                                    <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-[#222]">
                                        <img
                                            src={(() => {
                                                try { return new URL(item.manga_cover).pathname; }
                                                catch { return item.manga_cover.startsWith("/") ? item.manga_cover : `/${item.manga_cover}`; }
                                            })()}
                                            alt={item.manga_title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-[#222] dark:text-white truncate group-hover:text-[#E50914]">
                                            {item.manga_title}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            {item.chapter_label} · hal {item.page_number}/{item.total_pages}
                                        </p>
                                        <div className="mt-1.5 h-1 rounded-full bg-gray-100 dark:bg-[#222] overflow-hidden w-full max-w-[140px]">
                                            <div
                                                className="h-full rounded-full bg-[#E50914]"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">{formatDateTime(item.last_read_at)}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
