"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/lib/auth";
import {
    getBookmarks,
    removeBookmark,
    type BookmarkItem,
    type Pagination,
} from "@/app/lib/user-api";
import { Trash2, BookMarked, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { mangaHref } from "@/app/lib/utils";

function normalizeCover(url: string | null | undefined): string {
    if (!url) return "/placeholder-cover.jpg";
    try { return new URL(url).pathname; } catch { return url.startsWith("/") ? url : `/${url}`; }
}

type SortBy = "created_at" | "title" | "updated_at";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: "created_at", label: "Terbaru ditambah" },
    { value: "updated_at", label: "Update terbaru" },
    { value: "title", label: "Judul A-Z" },
];

export default function BookmarksPage() {
    const { token, isLoggedIn, isLoading } = useAuth();
    const [items, setItems] = useState<BookmarkItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortBy>("created_at");
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(
        async (page: number, sort: SortBy) => {
            if (!token) return;
            setLoading(true);
            try {
                const data = await getBookmarks(
                    token,
                    page,
                    20,
                    sort,
                    sort === "title" ? "asc" : "desc"
                );
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
        if (isLoggedIn && token) load(1, sortBy);
        else if (!isLoading) setLoading(false);
    }, [isLoggedIn, token, isLoading, load, sortBy]);

    const handleDelete = async (mangaSlug: string) => {
        if (!token || deleting) return;
        setDeleting(mangaSlug);
        try {
            await removeBookmark(token, mangaSlug);
            setItems((prev) => prev.filter((i) => i.manga_slug !== mangaSlug));
        } catch {
            alert("Gagal hapus bookmark.");
        } finally {
            setDeleting(null);
        }
    };

    const handleSortChange = (newSort: SortBy) => {
        setSortBy(newSort);
        load(1, newSort);
    };

    if (isLoading || loading) {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-[3/5] rounded-xl bg-gray-100 dark:bg-[#1a1a1a] animate-pulse" />
                ))}
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="text-5xl">🔐</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Login untuk melihat bookmarks kamu.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h1 className="text-[16px] font-bold text-[#222] dark:text-white flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4 text-[#E50914]" /> Bookmarks
                    {pagination && (
                        <span className="text-[12px] font-normal text-gray-400 ml-1">({pagination.total})</span>
                    )}
                </h1>
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value as SortBy)}
                        className="text-[12px] bg-gray-100 dark:bg-[#1a1a1a] text-[#222] dark:text-gray-200 border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2 py-1 outline-none"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] py-20 text-center">
                    <div className="text-5xl mb-3">🔖</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada bookmark.</p>
                    <Link href="/" className="mt-3 inline-block text-[13px] text-[#E50914] hover:underline">
                        Cari manga →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {items.map((item) => (
                            <div key={item.manga_slug} className="relative group">
                                <Link href={mangaHref(item.manga_type_slug, item.manga_slug)}>
                                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-[#222]">
                                        <img
                                            src={normalizeCover(item.manga_cover)}
                                            alt={item.manga_title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                        {/* Chapters */}
                                        {item.total_chapters > 0 && (
                                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded">
                                                {item.total_chapters} ch
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold text-[#222] dark:text-gray-200 line-clamp-2 leading-tight">
                                        {item.manga_title}
                                    </p>
                                </Link>
                                {/* Delete button */}
                                <button
                                    onClick={() => handleDelete(item.manga_slug)}
                                    disabled={deleting === item.manga_slug}
                                    title="Hapus bookmark"
                                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-40"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.total_pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => load(currentPage - 1, sortBy)}
                                disabled={currentPage <= 1}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
                            >
                                ← Prev
                            </button>
                            <span className="text-sm text-gray-500">{currentPage} / {pagination.total_pages}</span>
                            <button
                                onClick={() => load(currentPage + 1, sortBy)}
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
