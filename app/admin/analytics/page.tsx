"use client";

import { useEffect, useState, useCallback } from "react";
import {
    fetchAnalyticsOverview,
    fetchMangaViews,
    fetchUserGrowth,
    fetchPopularGenres,
    fetchTopManga,
    fetchRecentActivity,
    deleteMangaViewsByPeriod,
    deleteMangaViewsByManga,
    deleteAllMangaViews,
    deleteChapterViewsByPeriod,
    deleteChapterViewsByChapter,
    deleteAllChapterViews,
    type AnalyticsOverview,
    type MangaViewsResponse,
    type UserGrowthResponse,
    type PopularGenresResponse,
    type TopMangaResponse,
    type TopMangaItem,
    type RecentActivityResponse,
    type ViewsDeleteResult,
} from "@/app/lib/admin-api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
    if (n === null || n === undefined) return "—";
    return n.toLocaleString("id-ID");
}

function relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}d lalu`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}j lalu`;
    return `${Math.floor(h / 24)}hr lalu`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    color = "accent",
    icon,
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: "accent" | "blue" | "green" | "orange" | "purple" | "pink";
    icon: React.ReactNode;
}) {
    const colorMap: Record<string, string> = {
        accent: "bg-accent/10 text-accent",
        blue: "bg-blue-500/10 text-blue-400",
        green: "bg-emerald-500/10 text-emerald-400",
        orange: "bg-orange-500/10 text-orange-400",
        purple: "bg-purple-500/10 text-purple-400",
        pink: "bg-pink-500/10 text-pink-400",
    };
    return (
        <div className="rounded-xl border border-border bg-card-bg p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{fmt(Number(value))}</p>
                    {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
                </div>
                <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>{icon}</div>
            </div>
        </div>
    );
}

function LoadingRows({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 w-full animate-pulse rounded bg-border" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function ErrorBox({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            ⚠️ {message}
        </div>
    );
}

function PaginationBar({
    page,
    totalPages,
    onChange,
}: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
}) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted">
                Halaman {page} / {totalPages}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-border disabled:opacity-40"
                >
                    ← Prev
                </button>
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-border disabled:opacity-40"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
    const [data, setData] = useState<AnalyticsOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAnalyticsOverview()
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card-bg" />
                ))}
            </div>
        );
    if (error) return <ErrorBox message={error} />;
    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Database stats */}
            <div>
                <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Database</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total User" value={data.database.total_users} sub={`Aktif hari ini: ${fmt(data.database.active_users_today)}`} color="green" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                    <StatCard label="Total Manga" value={data.database.total_manga} sub={`Ongoing: ${fmt(data.database.manga_ongoing)} · Selesai: ${fmt(data.database.manga_completed)}`} color="accent" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
                    <StatCard label="Total Chapter" value={data.database.total_chapters} color="blue" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                    <StatCard label="User Aktif Minggu Ini" value={data.database.active_users_week} color="orange" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                </div>
            </div>

            {/* Views stats */}
            <div>
                <h3 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Views</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Total Views Manga" value={data.views.total_manga_views} sub={`Chapter views: ${fmt(data.views.total_chapter_views)}`} color="purple" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
                    <StatCard label="Views Hari Ini" value={data.views.views_today} sub={`Minggu ini: ${fmt(data.views.views_week)}`} color="pink" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                    <StatCard label="Views Bulan Ini" value={data.views.views_month} color="blue" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                </div>
            </div>

            {/* Engagement + Popular Genres */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Engagement */}
                <div className="rounded-xl border border-border bg-card-bg p-5">
                    <h3 className="mb-4 font-semibold text-foreground">Engagement</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted">Total Bookmark</span>
                            <span className="font-semibold text-foreground">{fmt(data.engagement.total_bookmarks)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted">Total Reading List</span>
                            <span className="font-semibold text-foreground">{fmt(data.engagement.total_reading_lists)}</span>
                        </div>
                    </div>
                </div>

                {/* Popular Genres */}
                <div className="rounded-xl border border-border bg-card-bg p-5">
                    <h3 className="mb-4 font-semibold text-foreground">Genre Terpopuler</h3>
                    <div className="space-y-2">
                        {data.popular_genres.slice(0, 5).map((g, i) => (
                            <div key={g.slug} className="flex items-center gap-3">
                                <span className="w-5 text-center text-xs font-bold text-muted">{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-foreground">{g.name}</span>
                                        <span className="text-muted">{fmt(g.manga_count)} manga</span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
                                        <div
                                            className="h-full rounded-full bg-accent"
                                            style={{ width: `${Math.min(100, (g.manga_count / (data.popular_genres[0]?.manga_count || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted">
                Data diambil: {new Date(data.timestamp).toLocaleString("id-ID")}
            </p>
        </div>
    );
}

// ─── Tab: Manga Views ─────────────────────────────────────────────────────────

function MangaViewsTab() {
    const [data, setData] = useState<MangaViewsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "all">("month");
    const [sortBy, setSortBy] = useState<"total_views" | "title">("total_views");

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        fetchMangaViews({ page, page_size: 20, period, sort_by: sortBy })
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [page, period, sortBy]);

    useEffect(() => { load(); }, [load]);

    const periodOpts = [
        { v: "today", l: "Hari Ini" },
        { v: "week", l: "Minggu Ini" },
        { v: "month", l: "Bulan Ini" },
        { v: "year", l: "Tahun Ini" },
        { v: "all", l: "Semua" },
    ] as const;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-muted">Periode:</label>
                    <select
                        value={period}
                        onChange={(e) => { setPeriod(e.target.value as typeof period); setPage(1); }}
                        className="rounded-lg border border-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        {periodOpts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-muted">Urut:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                        className="rounded-lg border border-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        <option value="total_views">Total Views</option>
                        <option value="title">Judul</option>
                    </select>
                </div>
                {data && <span className="ml-auto text-xs text-muted">Total: {fmt(data.pagination.total)} manga</span>}
            </div>

            {error && <ErrorBox message={error} />}

            <div className="overflow-hidden rounded-xl border border-border bg-card-bg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Manga</th>
                                <th className="px-4 py-3 text-right">Total Views</th>
                                <th className="px-4 py-3 text-right">Hari Ini</th>
                                <th className="px-4 py-3 text-right">Minggu Ini</th>
                                <th className="px-4 py-3 text-right">Bulan Ini</th>
                                <th className="px-4 py-3 text-right">Unique</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <LoadingRows cols={7} />
                            ) : (
                                data?.items.map((item, i) => (
                                    <tr key={item.manga_id} className="hover:bg-border/30 transition-colors">
                                        <td className="px-4 py-3 text-muted">{(page - 1) * 20 + i + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{item.manga_title}</p>
                                            <p className="text-xs text-muted">{item.manga_slug}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(item.total_views)}</td>
                                        <td className="px-4 py-3 text-right text-muted">{fmt(item.views_today)}</td>
                                        <td className="px-4 py-3 text-right text-muted">{fmt(item.views_week)}</td>
                                        <td className="px-4 py-3 text-right text-muted">{fmt(item.views_month)}</td>
                                        <td className="px-4 py-3 text-right text-muted">{fmt(item.unique_viewers)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {data && (
                    <PaginationBar
                        page={data.pagination.page}
                        totalPages={data.pagination.total_pages}
                        onChange={setPage}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Tab: User Growth ─────────────────────────────────────────────────────────

function UserGrowthTab() {
    const [data, setData] = useState<UserGrowthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [days, setDays] = useState(30);

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        fetchUserGrowth(days)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [days]);

    useEffect(() => { load(); }, [load]);

    const maxNew = data ? Math.max(...data.data.map((d) => d.new_users), 1) : 1;

    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Rentang:</label>
                {([7, 30, 90, 365] as const).map((d) => (
                    <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${days === d
                            ? "bg-accent text-white"
                            : "border border-border text-muted hover:bg-border hover:text-foreground"
                            }`}
                    >
                        {d} hari
                    </button>
                ))}
                {data && (
                    <span className="ml-auto text-xs text-muted">
                        +{fmt(data.total_new_users)} user baru dalam {data.period_days} hari
                    </span>
                )}
            </div>

            {error && <ErrorBox message={error} />}

            {/* Mini chart */}
            {!loading && data && data.data.length > 0 && (
                <div className="rounded-xl border border-border bg-card-bg p-4">
                    <h3 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">Tren Registrasi Harian</h3>
                    <div className="flex h-24 items-end gap-0.5">
                        {data.data.map((entry) => (
                            <div
                                key={entry.date}
                                title={`${entry.date}: ${entry.new_users} user baru`}
                                className="flex-1 rounded-t bg-accent/70 hover:bg-accent transition-colors cursor-default"
                                style={{ height: `${(entry.new_users / maxNew) * 100}%`, minHeight: "2px" }}
                            />
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted">
                        <span>{data.data[0]?.date}</span>
                        <span>{data.data[data.data.length - 1]?.date}</span>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card-bg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3 text-right">User Baru</th>
                                <th className="px-4 py-3 text-right">Kumulatif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <LoadingRows cols={3} />
                            ) : (
                                [...(data?.data ?? [])].reverse().map((entry) => (
                                    <tr key={entry.date} className="hover:bg-border/30 transition-colors">
                                        <td className="px-4 py-3 text-foreground">{entry.date}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">+{fmt(entry.new_users)}</td>
                                        <td className="px-4 py-3 text-right text-muted">{fmt(entry.total_users)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Popular Genres ──────────────────────────────────────────────────────

function PopularGenresTab() {
    const [data, setData] = useState<PopularGenresResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [limit, setLimit] = useState(10);

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        fetchPopularGenres(limit)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [limit]);

    useEffect(() => { load(); }, [load]);

    const maxViews = data ? Math.max(...data.genres.map((g) => g.total_views), 1) : 1;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Tampilkan:</label>
                {([10, 20, 50] as const).map((l) => (
                    <button
                        key={l}
                        onClick={() => setLimit(l)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${limit === l
                            ? "bg-accent text-white"
                            : "border border-border text-muted hover:bg-border hover:text-foreground"
                            }`}
                    >
                        Top {l}
                    </button>
                ))}
                {data && <span className="ml-auto text-xs text-muted">Total genre: {data.total_genres}</span>}
            </div>

            {error && <ErrorBox message={error} />}

            <div className="overflow-hidden rounded-xl border border-border bg-card-bg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Genre</th>
                                <th className="px-4 py-3 text-right">Manga</th>
                                <th className="px-4 py-3 text-right">Total Views</th>
                                <th className="px-4 py-3 text-right">Bookmark</th>
                                <th className="px-4 py-3">Popularitas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <LoadingRows cols={6} />
                            ) : (
                                data?.genres.map((g, i) => (
                                    <tr key={g.id} className="hover:bg-border/30 transition-colors">
                                        <td className="px-4 py-3 font-bold text-muted">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{g.name}</p>
                                            <p className="text-xs text-muted">{g.slug}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(g.manga_count)}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(g.total_views)}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(g.bookmarks)}</td>
                                        <td className="px-4 py-3 w-32">
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                                                <div
                                                    className="h-full rounded-full bg-accent"
                                                    style={{ width: `${(g.total_views / maxViews) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Top Manga ────────────────────────────────────────────────────────────

function TopMangaTab() {
    const [data, setData] = useState<TopMangaResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [metric, setMetric] = useState<"views" | "bookmarks" | "reading_lists">("views");
    const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
    const [limit, setLimit] = useState(10);

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        fetchTopManga({ metric, period, limit })
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [metric, period, limit]);

    useEffect(() => { load(); }, [load]);

    const metricLabel = (item: TopMangaItem) => {
        if (metric === "views") return fmt(item.views);
        if (metric === "bookmarks") return fmt(item.bookmarks);
        return fmt(item.in_reading_lists);
    };

    const metricColLabel = metric === "views" ? "Views" : metric === "bookmarks" ? "Bookmark" : "Reading List";

    const rankColor = (rank: number) => {
        if (rank === 1) return "text-yellow-400 font-bold";
        if (rank === 2) return "text-slate-300 font-bold";
        if (rank === 3) return "text-orange-400 font-bold";
        return "text-muted";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-muted">Metrik:</label>
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as typeof metric)}
                        className="rounded-lg border border-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        <option value="views">Views</option>
                        <option value="bookmarks">Bookmark</option>
                        <option value="reading_lists">Reading List</option>
                    </select>
                </div>
                {metric === "views" && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted">Periode:</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as typeof period)}
                            className="rounded-lg border border-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                            <option value="today">Hari Ini</option>
                            <option value="week">Minggu Ini</option>
                            <option value="month">Bulan Ini</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <label className="text-xs text-muted">Limit:</label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="rounded-lg border border-border bg-card-bg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                        <option value={50}>Top 50</option>
                    </select>
                </div>
            </div>

            {error && <ErrorBox message={error} />}

            <div className="overflow-hidden rounded-xl border border-border bg-card-bg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                                <th className="px-4 py-3">Rank</th>
                                <th className="px-4 py-3">Manga</th>
                                <th className="px-4 py-3 text-right">{metricColLabel}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <LoadingRows cols={3} />
                            ) : (
                                data?.items.map((item) => (
                                    <tr key={item.manga_id} className="hover:bg-border/30 transition-colors">
                                        <td className={`px-4 py-3 text-lg ${rankColor(item.rank)}`}>
                                            {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : `#${item.rank}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-foreground">{item.manga_title}</p>
                                            <p className="text-xs text-muted">{item.manga_slug}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-foreground">{metricLabel(item)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Recent Activity ─────────────────────────────────────────────────────

function RecentActivityTab() {
    const [data, setData] = useState<RecentActivityResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [limit, setLimit] = useState(50);

    const load = useCallback(() => {
        setLoading(true);
        setError("");
        fetchRecentActivity(limit)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [limit]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <label className="text-xs text-muted">Tampilkan:</label>
                {([20, 50, 100, 200] as const).map((l) => (
                    <button
                        key={l}
                        onClick={() => setLimit(l)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${limit === l
                            ? "bg-accent text-white"
                            : "border border-border text-muted hover:bg-border hover:text-foreground"
                            }`}
                    >
                        {l}
                    </button>
                ))}
                {data && (
                    <span className="ml-auto text-xs text-muted">
                        {data.recent_activity.length} aktivitas
                    </span>
                )}
            </div>

            {error && <ErrorBox message={error} />}

            <div className="overflow-hidden rounded-xl border border-border bg-card-bg">
                {loading ? (
                    <div className="divide-y divide-border">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3">
                                <div className="h-8 w-8 animate-pulse rounded-full bg-border" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-48 animate-pulse rounded bg-border" />
                                    <div className="h-3 w-24 animate-pulse rounded bg-border" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {data?.recent_activity.map((act, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-border/30 transition-colors">
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${act.type === "view"
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "bg-pink-500/10 text-pink-400"
                                        }`}
                                >
                                    {act.type === "view" ? "👁" : "🔖"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">
                                        <span className="font-medium">{act.username}</span>
                                        <span className="text-muted">
                                            {" "}{act.type === "view" ? "melihat" : "mem-bookmark"}{" "}
                                        </span>
                                        <span className="font-medium">{act.manga_title}</span>
                                    </p>
                                </div>
                                <span className="text-xs text-muted shrink-0">{relativeTime(act.timestamp)}</span>
                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${act.type === "view"
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "bg-pink-500/10 text-pink-400"
                                        }`}
                                >
                                    {act.type === "view" ? "View" : "Bookmark"}
                                </span>
                            </div>
                        ))}
                        {data?.recent_activity.length === 0 && (
                            <p className="px-4 py-8 text-center text-sm text-muted">Belum ada aktivitas.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Tab: Views Cleanup ────────────────────────────────────────────────────────────────────────

type CleanupResult = ViewsDeleteResult & { _action?: string };

function ResultBox({ result, onClose }: { result: CleanupResult; onClose: () => void }) {
    return (
        <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${result.success
                ? "border-emerald-800/40 bg-emerald-900/20 text-emerald-400"
                : "border-red-800/40 bg-red-900/20 text-red-400"
            }`}>
            <span className="text-lg">{result.success ? "✅" : "❌"}</span>
            <div className="flex-1">
                <p className="font-semibold">{result.success ? "Berhasil" : "Gagal"}</p>
                <p className="mt-0.5">{result.message}</p>
                {result.success && (
                    <p className="mt-1 text-xs opacity-75">Deleted: {result.deleted_count.toLocaleString("id-ID")} records</p>
                )}
                {result.cutoff_date && (
                    <p className="mt-0.5 text-xs opacity-75">Cutoff: {new Date(result.cutoff_date).toLocaleString("id-ID")}</p>
                )}
            </div>
            <button onClick={onClose} className="shrink-0 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
    );
}

function DeleteButton({
    label,
    description,
    danger = false,
    onConfirm,
}: {
    label: string;
    description: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
}) {
    const [status, setStatus] = useState<"idle" | "confirm" | "loading">("idle");

    const handleClick = async () => {
        if (status === "idle") { setStatus("confirm"); return; }
        if (status === "confirm") {
            setStatus("loading");
            try { await onConfirm(); } finally { setStatus("idle"); }
        }
    };

    return (
        <div className={`flex items-center justify-between rounded-lg border p-4 ${danger ? "border-red-800/30 bg-red-900/10" : "border-border bg-card-bg"
            }`}>
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                {status === "confirm" && (
                    <span className="text-xs text-orange-400 font-medium">Yakin?</span>
                )}
                {status === "confirm" && (
                    <button
                        onClick={() => setStatus("idle")}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-border"
                    >
                        Batal
                    </button>
                )}
                <button
                    onClick={handleClick}
                    disabled={status === "loading"}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${status === "confirm"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : danger
                                ? "border border-red-700/50 text-red-400 hover:bg-red-900/30"
                                : "border border-border text-muted hover:bg-border hover:text-foreground"
                        }`}
                >
                    {status === "loading" ? "Menghapus..." : status === "confirm" ? "Ya, Hapus" : "🗑 Hapus"}
                </button>
            </div>
        </div>
    );
}

function ViewsCleanupTab() {
    const [mangaDays, setMangaDays] = useState(30);
    const [chapterDays, setChapterDays] = useState(30);
    const [mangaId, setMangaId] = useState("");
    const [chapterId, setChapterId] = useState("");
    const [result, setResult] = useState<CleanupResult | null>(null);
    const [error, setError] = useState("");

    const run = async (fn: () => Promise<ViewsDeleteResult>) => {
        setResult(null);
        setError("");
        try {
            const r = await fn();
            setResult(r);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Terjadi kesalahan");
        }
    };

    return (
        <div className="space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg border border-orange-700/40 bg-orange-900/10 px-4 py-3 text-sm text-orange-400">
                <span className="text-base">⚠️</span>
                <p>Semua operasi delete <strong>tidak bisa dibatalkan</strong>. Pastikan sudah yakin sebelum menjalankan. Klik tombol sekali untuk konfirmasi, klik lagi untuk eksekusi.</p>
            </div>

            {/* Result / Error */}
            {result && <ResultBox result={result} onClose={() => setResult(null)} />}
            {error && <ErrorBox message={error} />}

            {/* Manga Views Cleanup */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <h3 className="text-sm font-semibold text-foreground">Manga Views</h3>
                </div>

                {/* By Period */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-card-bg p-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Hapus berdasarkan periode</p>
                        <p className="text-xs text-muted mt-0.5">Hapus manga views yang lebih tua dari N hari</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={mangaDays}
                            onChange={(e) => setMangaDays(Math.max(1, Number(e.target.value)))}
                            min={1}
                            max={3650}
                            className="w-20 rounded-lg border border-border bg-card-bg px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <span className="text-xs text-muted">hari</span>
                        <DeleteButton
                            label=""
                            description=""
                            onConfirm={() => run(() => deleteMangaViewsByPeriod(mangaDays))}
                        />
                    </div>
                </div>

                {/* By Manga ID */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-card-bg p-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Hapus by Manga ID</p>
                        <p className="text-xs text-muted mt-0.5">Hapus semua views untuk 1 manga tertentu</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">ID:</span>
                        <input
                            type="number"
                            value={mangaId}
                            onChange={(e) => setMangaId(e.target.value)}
                            placeholder="e.g. 1"
                            className="w-24 rounded-lg border border-border bg-card-bg px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <DeleteButton
                            label=""
                            description=""
                            onConfirm={() => {
                                if (!mangaId) return Promise.reject(new Error("Masukkan Manga ID"));
                                return run(() => deleteMangaViewsByManga(Number(mangaId)));
                            }}
                        />
                    </div>
                </div>

                {/* All */}
                <DeleteButton
                    label="Hapus SEMUA Manga Views"
                    description="Menghapus seluruh data tabel manga_views. Tidak bisa dibatalkan!"
                    danger
                    onConfirm={() => run(deleteAllMangaViews)}
                />
            </div>

            {/* Chapter Views Cleanup */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="text-sm font-semibold text-foreground">Chapter Views</h3>
                </div>

                {/* By Period */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-card-bg p-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Hapus berdasarkan periode</p>
                        <p className="text-xs text-muted mt-0.5">Hapus chapter views yang lebih tua dari N hari</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={chapterDays}
                            onChange={(e) => setChapterDays(Math.max(1, Number(e.target.value)))}
                            min={1}
                            max={3650}
                            className="w-20 rounded-lg border border-border bg-card-bg px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <span className="text-xs text-muted">hari</span>
                        <DeleteButton
                            label=""
                            description=""
                            onConfirm={() => run(() => deleteChapterViewsByPeriod(chapterDays))}
                        />
                    </div>
                </div>

                {/* By Chapter ID */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-card-bg p-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Hapus by Chapter ID</p>
                        <p className="text-xs text-muted mt-0.5">Hapus semua views untuk 1 chapter tertentu</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">ID:</span>
                        <input
                            type="number"
                            value={chapterId}
                            onChange={(e) => setChapterId(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-24 rounded-lg border border-border bg-card-bg px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <DeleteButton
                            label=""
                            description=""
                            onConfirm={() => {
                                if (!chapterId) return Promise.reject(new Error("Masukkan Chapter ID"));
                                return run(() => deleteChapterViewsByChapter(Number(chapterId)));
                            }}
                        />
                    </div>
                </div>

                {/* All */}
                <DeleteButton
                    label="Hapus SEMUA Chapter Views"
                    description="Menghapus seluruh data tabel chapter_views. Tidak bisa dibatalkan!"
                    danger
                    onConfirm={() => run(deleteAllChapterViews)}
                />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "manga-views", label: "Manga Views" },
    { id: "user-growth", label: "User Growth" },
    { id: "genres", label: "Popular Genres" },
    { id: "top-manga", label: "Top Manga" },
    { id: "activity", label: "Recent Activity" },
    { id: "cleanup", label: "🗑 Views Cleanup" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("overview");

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="mt-1 text-sm text-muted">Statistik platform, tren user, dan aktivitas terkini</p>
            </div>

            {/* Tab navigation */}
            <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                            ? "border-accent text-accent"
                            : "border-transparent text-muted hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "manga-views" && <MangaViewsTab />}
            {activeTab === "user-growth" && <UserGrowthTab />}
            {activeTab === "genres" && <PopularGenresTab />}
            {activeTab === "top-manga" && <TopMangaTab />}
            {activeTab === "activity" && <RecentActivityTab />}
            {activeTab === "cleanup" && <ViewsCleanupTab />}
        </div>
    );
}
