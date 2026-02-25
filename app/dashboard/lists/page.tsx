"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/lib/auth";
import {
    getReadingLists,
    removeFromReadingList,
    addToReadingList,
    type ReadingListItem,
    type ReadingListStatus,
    type Pagination,
} from "@/app/lib/user-api";
import { Trash2, List, Star } from "lucide-react";
import Link from "next/link";

function normalizeCover(url: string | null | undefined): string {
    if (!url) return "/placeholder-cover.jpg";
    try { return new URL(url).pathname; } catch { return url.startsWith("/") ? url : `/${url}`; }
}

const STATUS_TABS: { value: ReadingListStatus | null; label: string; color: string }[] = [
    { value: null, label: "Semua", color: "bg-gray-500" },
    { value: "reading", label: "Dibaca", color: "bg-blue-500" },
    { value: "plan_to_read", label: "Plan", color: "bg-yellow-500" },
    { value: "completed", label: "Selesai", color: "bg-emerald-500" },
    { value: "dropped", label: "Dropped", color: "bg-red-500" },
    { value: "on_hold", label: "On Hold", color: "bg-orange-500" },
];

const STATUS_LABELS: Record<ReadingListStatus, string> = {
    reading: "Dibaca",
    plan_to_read: "Plan",
    completed: "Selesai",
    dropped: "Dropped",
    on_hold: "On Hold",
};

const STATUS_COLORS: Record<ReadingListStatus, string> = {
    reading: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    plan_to_read: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dropped: "bg-red-500/10 text-red-500",
    on_hold: "bg-orange-500/10 text-orange-500",
};

export default function ListsPage() {
    const { token, isLoggedIn, isLoading } = useAuth();
    const [items, setItems] = useState<ReadingListItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<ReadingListStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [changingStatus, setChangingStatus] = useState<string | null>(null);

    const load = useCallback(
        async (page: number, status: ReadingListStatus | null) => {
            if (!token) return;
            setLoading(true);
            try {
                const data = await getReadingLists(token, status, page, 20);
                setItems(data.items);
                setPagination(data.pagination);
                setCurrentPage(page);
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (isLoggedIn && token) load(1, activeTab);
        else if (!isLoading) setLoading(false);
    }, [isLoggedIn, token, isLoading, load, activeTab]);

    const handleTabChange = (tab: ReadingListStatus | null) => {
        setActiveTab(tab);
        load(1, tab);
    };

    const handleDelete = async (mangaSlug: string) => {
        if (!token || deleting) return;
        if (!confirm("Hapus dari reading list?")) return;
        setDeleting(mangaSlug);
        try {
            await removeFromReadingList(token, mangaSlug);
            setItems((prev) => prev.filter((i) => i.manga_slug !== mangaSlug));
        } catch {
            alert("Gagal hapus dari reading list.");
        } finally {
            setDeleting(null);
        }
    };

    const handleStatusChange = async (mangaSlug: string, newStatus: ReadingListStatus) => {
        if (!token || changingStatus) return;
        setChangingStatus(mangaSlug);
        try {
            await addToReadingList(token, mangaSlug, newStatus);
            setItems((prev) =>
                prev.map((i) =>
                    i.manga_slug === mangaSlug ? { ...i, status: newStatus } : i
                )
            );
        } catch {
            alert("Gagal ubah status.");
        } finally {
            setChangingStatus(null);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse" />
                ))}
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="text-5xl">🔐</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Login untuk melihat reading list kamu.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-[16px] font-bold text-[#222] dark:text-white flex items-center gap-1.5">
                    <List className="w-4 h-4 text-[#E50914]" /> Reading List
                    {pagination && (
                        <span className="text-[12px] font-normal text-gray-400 ml-1">({pagination.total})</span>
                    )}
                </h1>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                {STATUS_TABS.map(({ value, label, color }) => (
                    <button
                        key={value ?? "all"}
                        onClick={() => handleTabChange(value)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${activeTab === value
                                ? `${color} text-white`
                                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] py-20 text-center">
                    <div className="text-5xl mb-3">📚</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeTab ? `Tidak ada manga dengan status "${STATUS_LABELS[activeTab]}".` : "Reading list kosong."}
                    </p>
                    <Link href="/" className="mt-3 inline-block text-[13px] text-[#E50914] hover:underline">
                        Cari manga →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {items.map((item) => {
                            const progressPct =
                                item.total_chapters > 0
                                    ? Math.round((item.read_chapters / item.total_chapters) * 100)
                                    : 0;

                            return (
                                <div
                                    key={item.manga_slug}
                                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-3"
                                >
                                    {/* Cover */}
                                    <Link href={`/${item.manga_slug}`} className="shrink-0">
                                        <div className="w-10 h-14 rounded overflow-hidden bg-gray-100 dark:bg-[#222]">
                                            <img
                                                src={normalizeCover(item.manga_cover)}
                                                alt={item.manga_title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/${item.manga_slug}`}>
                                            <p className="text-[13px] font-semibold text-[#222] dark:text-white truncate hover:text-[#E50914]">
                                                {item.manga_title}
                                            </p>
                                        </Link>

                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {/* Status selector */}
                                            <select
                                                value={item.status}
                                                onChange={(e) =>
                                                    handleStatusChange(item.manga_slug, e.target.value as ReadingListStatus)
                                                }
                                                disabled={changingStatus === item.manga_slug}
                                                className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border-0 outline-none cursor-pointer capitalize ${STATUS_COLORS[item.status]}`}
                                            >
                                                {STATUS_TABS.filter((t) => t.value !== null).map(({ value, label }) => (
                                                    <option key={value} value={value!} className="bg-white dark:bg-[#111] text-[#222] dark:text-white">
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Rating */}
                                            {item.rating !== null && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-semibold">
                                                    <Star className="w-2.5 h-2.5 fill-yellow-500" />
                                                    {item.rating}/10
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress */}
                                        {item.total_chapters > 0 && (
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <div className="h-1 rounded-full bg-gray-100 dark:bg-[#222] overflow-hidden w-full max-w-[140px]">
                                                    <div
                                                        className="h-full rounded-full bg-[#E50914]"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-400">
                                                    {item.read_chapters}/{item.total_chapters}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(item.manga_slug)}
                                        disabled={!!deleting}
                                        title="Hapus dari list"
                                        className="p-1 rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total_pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => load(currentPage - 1, activeTab)}
                                disabled={currentPage <= 1}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
                            >
                                ← Prev
                            </button>
                            <span className="text-sm text-gray-500">{currentPage} / {pagination.total_pages}</span>
                            <button
                                onClick={() => load(currentPage + 1, activeTab)}
                                disabled={currentPage >= pagination.total_pages}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
