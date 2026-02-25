"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/lib/auth";
import {
    getReadingHistory,
    deleteReadingHistory,
    type ReadingHistoryItem,
    type Pagination,
} from "@/app/lib/user-api";
import { Trash2, BookOpen } from "lucide-react";
import Link from "next/link";

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 30) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID");
}

function normalizeCover(url: string | null | undefined): string {
    if (!url) return "/placeholder-cover.jpg";
    try { return new URL(url).pathname; } catch { return url.startsWith("/") ? url : `/${url}`; }
}

export default function HistoryPage() {
    const { token, isLoggedIn, isLoading } = useAuth();
    const [items, setItems] = useState<ReadingHistoryItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(
        async (page: number) => {
            if (!token) return;
            setLoading(true);
            try {
                const data = await getReadingHistory(token, page, 20);
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
        if (isLoggedIn && token) load(1);
        else if (!isLoading) setLoading(false);
    }, [isLoggedIn, token, isLoading, load]);

    const handleDelete = async (mangaSlug: string) => {
        if (!token || deleting) return;
        setDeleting(mangaSlug);
        try {
            await deleteReadingHistory(token, mangaSlug);
            setItems((prev) => prev.filter((i) => i.manga_slug !== mangaSlug));
        } catch {
            alert("Gagal hapus history.");
        } finally {
            setDeleting(null);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse" />
                ))}
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="text-5xl">🔐</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Login untuk melihat reading history kamu.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-[16px] font-bold text-[#222] dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#E50914]" /> Reading History
                </h1>
                {pagination && (
                    <span className="text-[12px] text-gray-400">{pagination.total} manga</span>
                )}
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] py-20 text-center">
                    <div className="text-5xl mb-3">📖</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada history baca.</p>
                    <Link href="/" className="mt-3 inline-block text-[13px] text-[#E50914] hover:underline">
                        Mulai baca sekarang →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {items.map((item) => {
                            const progress = Math.round((item.page_number / item.total_pages) * 100);
                            return (
                                <div
                                    key={`${item.manga_slug}-${item.chapter_slug}`}
                                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-3 group"
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
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            {item.chapter_label} · hal {item.page_number}/{item.total_pages}
                                        </p>
                                        {/* Progress bar */}
                                        <div className="mt-1.5 h-1 rounded-full bg-gray-100 dark:bg-[#222] overflow-hidden w-full max-w-[160px]">
                                            <div
                                                className="h-full rounded-full bg-[#E50914] transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Meta + Delete */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-[10px] text-gray-400">{timeAgo(item.last_read_at)}</span>
                                        <button
                                            onClick={() => handleDelete(item.manga_slug)}
                                            disabled={deleting === item.manga_slug}
                                            title="Hapus history"
                                            className="p-1 rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total_pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => load(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
                            >
                                ← Prev
                            </button>
                            <span className="text-sm text-gray-500">
                                {currentPage} / {pagination.total_pages}
                            </span>
                            <button
                                onClick={() => load(currentPage + 1)}
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
