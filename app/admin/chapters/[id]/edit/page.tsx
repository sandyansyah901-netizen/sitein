"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
    fetchAdminChapterDetail,
    adminAddChapterPages,
    adminDeleteChapterPage,
    adminSwapChapterPages,
    adminReorderChapterPages,
    type ChapterPage,
    type ChapterWithPages,
} from "@/app/lib/admin-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = "http://127.0.0.1:8000";

function proxyUrl(page: ChapterPage): string {
    return `${API_BASE}${page.proxy_url}`;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
    return (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm ${type === "ok"
            ? "border-emerald-700/40 bg-emerald-900/80 text-emerald-300"
            : "border-red-700/40 bg-red-900/80 text-red-300"
            }`}>
            {type === "ok" ? "✓ " : "✕ "}{msg}
        </div>
    );
}

// ─── Page Card (in file panel) ───────────────────────────────────────────────

function PageCard({
    page,
    index,
    selected,
    swapMode,
    swapFirst,
    onSelect,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    isDraggingOver,
}: {
    page: ChapterPage;
    index: number;
    selected: boolean;
    swapMode: boolean;
    swapFirst: ChapterPage | null;
    onSelect: () => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    isDraggingOver: boolean;
}) {
    const isSwapFirst = swapFirst?.id === page.id;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onSelect}
            className={`group relative flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 transition-all ${isDraggingOver ? "border-accent/60 bg-accent/10 scale-[0.98]" :
                isSwapFirst ? "border-blue-500 bg-blue-900/20" :
                    selected ? "border-accent bg-accent/10" :
                        "border-border bg-card-bg hover:border-border/80 hover:bg-border/30"
                }`}
        >
            {/* Drag handle */}
            <div className="cursor-grab text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                </svg>
            </div>

            {/* Thumbnail */}
            <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={proxyUrl(page)}
                    alt={`Page ${page.page_order}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>

            {/* Label */}
            <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${selected ? "text-accent" : "text-foreground"}`}>
                    Hlm {page.page_order}
                </p>
                <p className="text-[10px] text-muted">#{page.id}</p>
            </div>

            {/* Swap badge */}
            {isSwapFirst && (
                <span className="shrink-0 rounded bg-blue-500/20 px-1 py-0.5 text-[9px] font-bold text-blue-400">A</span>
            )}
            {swapMode && !isSwapFirst && swapFirst && (
                <span className="shrink-0 rounded bg-muted/20 px-1 py-0.5 text-[9px] font-bold text-muted">B?</span>
            )}

            {/* Delete btn */}
            {!swapMode && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="shrink-0 rounded p-0.5 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    title="Hapus halaman"
                >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────

function UploadZone({
    chapterId,
    insertAfter,
    onSuccess,
    onError,
}: {
    chapterId: number;
    insertAfter?: number;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: File[]) => {
        if (!files.length) return;
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        if (!imageFiles.length) { onError("Hanya file gambar yang diizinkan"); return; }
        setUploading(true);
        try {
            const result = await adminAddChapterPages(chapterId, imageFiles, insertAfter);
            onSuccess(`${result.pages_added} halaman ditambahkan → total ${result.total_pages_after} halaman`);
        } catch (e) {
            onError(e instanceof Error ? e.message : "Upload gagal");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div
            onDragEnter={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(Array.from(e.dataTransfer.files));
            }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${dragOver ? "border-accent bg-accent/10" :
                uploading ? "border-border bg-border/20" :
                    "border-border hover:border-accent/50 hover:bg-accent/5"
                }`}
        >
            <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
            {uploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengupload...
                </div>
            ) : (
                <>
                    <svg className="mx-auto mb-1 h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-xs text-muted">
                        {insertAfter !== undefined ? `Sisipkan setelah hlm ${insertAfter}` : "Tambah di akhir"}
                    </p>
                    <p className="text-[10px] text-muted/60 mt-0.5">Drop / klik</p>
                </>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ChapterEditPage({ params }: PageProps) {
    const [chapterId, setChapterId] = useState<number | null>(null);
    const [detail, setDetail] = useState<ChapterWithPages | null>(null);
    const [pages, setPages] = useState<ChapterPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // UI State
    const [selectedPage, setSelectedPage] = useState<ChapterPage | null>(null);
    const [swapMode, setSwapMode] = useState(false);
    const [swapFirst, setSwapFirst] = useState<ChapterPage | null>(null);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);
    const [hasUnsaved, setHasUnsaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [swapping, setSwapping] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [insertAfterPage, setInsertAfterPage] = useState<number | undefined>(undefined);
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

    const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // Load params
    useEffect(() => {
        params.then((p) => setChapterId(Number(p.id)));
    }, [params]);

    // Load chapter detail — 1 API call langsung ke GET /admin/chapter/{id}
    const load = useCallback(async () => {
        if (!chapterId) return;
        setLoading(true); setError("");
        try {
            const d = await fetchAdminChapterDetail(chapterId);
            setDetail(d);
            const sorted = [...(d.pages ?? [])].sort((a, b) => a.page_order - b.page_order);
            setPages(sorted);
            if (sorted.length && !selectedPage) setSelectedPage(sorted[0]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal memuat chapter");
        } finally {
            setLoading(false);
        }
    }, [chapterId, selectedPage]);

    useEffect(() => { load(); }, [chapterId]); // eslint-disable-line

    // ── Drag & Drop reorder ───────────────────────────────────────────────────

    const handleDragStart = (idx: number) => setDragIdx(idx);

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        setOverIdx(idx);
    };

    const handleDrop = (idx: number) => {
        if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
        const next = [...pages];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(idx, 0, moved);
        setPages(next);
        setHasUnsaved(true);
        setDragIdx(null);
        setOverIdx(null);
    };

    const handleSaveOrder = async () => {
        if (!detail) return;
        setSaving(true);
        try {
            const pageOrders = pages.map((p, i) => ({ page_id: p.id, new_order: i + 1 }));
            const result = await adminReorderChapterPages(detail.id, pageOrders);
            showToast(result.message || "Urutan berhasil disimpan");
            setHasUnsaved(false);
            await load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Gagal simpan urutan", "err");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete page ───────────────────────────────────────────────────────────

    const handleDelete = async (page: ChapterPage) => {
        if (!detail) return;
        if (!confirm(`Hapus halaman ${page.page_order}? File di GDrive juga akan dihapus.`)) return;
        setDeleting(page.id);
        try {
            const result = await adminDeleteChapterPage(detail.id, page.id);
            showToast(result.message || "Halaman dihapus");
            if (selectedPage?.id === page.id) setSelectedPage(null);
            await load();
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Gagal hapus halaman", "err");
        } finally {
            setDeleting(null);
        }
    };

    // ── Swap pages ────────────────────────────────────────────────────────────

    const handleSwapClick = (page: ChapterPage) => {
        if (!swapFirst) {
            setSwapFirst(page);
            return;
        }
        if (swapFirst.id === page.id) {
            setSwapFirst(null);
            return;
        }
        // Execute swap
        setSwapping(true);
        adminSwapChapterPages(detail!.id, swapFirst.id, page.id)
            .then((r) => {
                showToast(r.message || "Swap berhasil");
                setSwapFirst(null);
                setSwapMode(false);
                return load();
            })
            .catch((e) => {
                showToast(e instanceof Error ? e.message : "Swap gagal", "err");
            })
            .finally(() => setSwapping(false));
    };

    const handlePageClick = (page: ChapterPage) => {
        if (swapMode) {
            handleSwapClick(page);
        } else {
            setSelectedPage(page);
        }
    };

    // ── Sidebar resize ────────────────────────────────────────────────────────

    const resizeRef = useRef(false);
    const handleResizeStart = () => { resizeRef.current = true; };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!resizeRef.current) return;
            const w = Math.max(180, Math.min(420, e.clientX));
            setSidebarWidth(w);
        };
        const onUp = () => { resizeRef.current = false; };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    }, []);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
            {/* ── Topbar ── */}
            <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card-bg px-4">
                <Link
                    href="/admin/chapters"
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Chapters
                </Link>

                <div className="h-4 w-px bg-border" />

                <div className="min-w-0 flex-1">
                    {loading ? (
                        <div className="h-4 w-48 animate-pulse rounded bg-border" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">
                                {detail?.manga?.title ?? "—"}
                            </span>
                            <span className="text-muted">/</span>
                            <span className="text-sm font-semibold text-foreground">
                                {detail?.chapter_label ?? `Chapter #${chapterId}`}
                            </span>
                            <span className="rounded bg-border px-2 py-0.5 text-[10px] text-muted">
                                {pages.length} hal
                            </span>
                            {hasUnsaved && (
                                <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                                    ● Belum disimpan
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Swap mode toggle */}
                    <button
                        onClick={() => { setSwapMode(!swapMode); setSwapFirst(null); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${swapMode
                            ? "border-blue-600 bg-blue-900/20 text-blue-400"
                            : "border-border text-muted hover:text-foreground"
                            }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        {swapMode ? (swapFirst ? "Pilih B…" : "Pilih A…") : "Swap Mode"}
                    </button>

                    {/* Upload */}
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload
                    </button>

                    {/* Save order */}
                    <button
                        onClick={handleSaveOrder}
                        disabled={!hasUnsaved || saving}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
                    >
                        {saving ? (
                            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                        )}
                        {saving ? "Menyimpan…" : "Simpan Urutan"}
                    </button>
                </div>
            </header>

            {/* ── Upload Panel (collapsible) ── */}
            {showUpload && detail && (
                <div className="shrink-0 border-b border-border bg-background/50 px-4 py-3">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <p className="mb-2 text-xs font-semibold text-foreground">Upload Halaman Baru</p>
                            <div className="grid grid-cols-2 gap-2">
                                <UploadZone
                                    chapterId={detail.id}
                                    onSuccess={(msg) => { showToast(msg); setShowUpload(false); load(); }}
                                    onError={(msg) => showToast(msg, "err")}
                                />
                                <div>
                                    <p className="mb-1.5 text-[10px] text-muted">Atau sisipkan setelah halaman ke-</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={pages.length}
                                            value={insertAfterPage ?? ""}
                                            onChange={(e) => setInsertAfterPage(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="0 = depan"
                                            className="w-24 rounded-lg border border-border bg-card-bg px-2 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-accent"
                                        />
                                        <span className="text-[10px] text-muted">/ {pages.length}</span>
                                    </div>
                                    {insertAfterPage !== undefined && (
                                        <div className="mt-2">
                                            <UploadZone
                                                chapterId={detail.id}
                                                insertAfter={insertAfterPage}
                                                onSuccess={(msg) => { showToast(msg); setShowUpload(false); load(); }}
                                                onError={(msg) => showToast(msg, "err")}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowUpload(false)} className="text-muted hover:text-foreground transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main area: sidebar + preview ── */}
            <div className="flex min-h-0 flex-1">
                {/* ── File Panel (left sidebar) ── */}
                <div
                    className="flex shrink-0 flex-col border-r border-border bg-card-bg"
                    style={{ width: sidebarWidth }}
                >
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            HALAMAN — {pages.length}
                        </span>
                        {swapMode && swapFirst && (
                            <button
                                onClick={() => setSwapFirst(null)}
                                className="text-[10px] text-blue-400 hover:underline"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Page list */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-12 animate-pulse rounded-lg border border-border bg-border/20" />
                            ))
                        ) : error ? (
                            <div className="p-3 text-center text-xs text-red-400">⚠️ {error}</div>
                        ) : pages.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted">Tidak ada halaman</div>
                        ) : (
                            pages.map((page, idx) => (
                                <PageCard
                                    key={page.id}
                                    page={page}
                                    index={idx}
                                    selected={selectedPage?.id === page.id && !swapMode}
                                    swapMode={swapMode}
                                    swapFirst={swapFirst}
                                    onSelect={() => handlePageClick(page)}
                                    onDelete={() => handleDelete(page)}
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDrop={() => handleDrop(idx)}
                                    isDraggingOver={overIdx === idx && dragIdx !== null && dragIdx !== idx}
                                />
                            ))
                        )}
                    </div>

                    {/* Swapping overlay */}
                    {swapping && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                            <svg className="h-6 w-6 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* ── Resize handle ── */}
                <div
                    onMouseDown={handleResizeStart}
                    className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-accent/50 transition-colors"
                />

                {/* ── Preview Area (right) ── */}
                <div className="flex min-h-0 flex-1 flex-col bg-background overflow-hidden">
                    {selectedPage && !swapMode ? (
                        <>
                            {/* Preview header */}
                            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card-bg px-4 py-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-foreground">
                                        Halaman {selectedPage.page_order}
                                    </span>
                                    <span className="text-xs text-muted">ID #{selectedPage.id}</span>
                                    {selectedPage.is_anchor && (
                                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">ANCHOR</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Nav prev/next */}
                                    <button
                                        onClick={() => {
                                            const idx = pages.findIndex((p) => p.id === selectedPage.id);
                                            if (idx > 0) setSelectedPage(pages[idx - 1]);
                                        }}
                                        disabled={pages.findIndex((p) => p.id === selectedPage.id) === 0}
                                        className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground disabled:opacity-30"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => {
                                            const idx = pages.findIndex((p) => p.id === selectedPage.id);
                                            if (idx < pages.length - 1) setSelectedPage(pages[idx + 1]);
                                        }}
                                        disabled={pages.findIndex((p) => p.id === selectedPage.id) === pages.length - 1}
                                        className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground disabled:opacity-30"
                                    >
                                        Next →
                                    </button>
                                    <div className="h-4 w-px bg-border" />
                                    <button
                                        onClick={() => handleDelete(selectedPage)}
                                        disabled={deleting === selectedPage.id}
                                        className="flex items-center gap-1 rounded-lg border border-red-800/40 px-2.5 py-1 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                                    >
                                        {deleting === selectedPage.id ? "…" : "🗑 Hapus"}
                                    </button>
                                </div>
                            </div>

                            {/* Image preview */}
                            <div className="flex flex-1 items-center justify-center overflow-auto bg-[#0a0a0a] p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    key={selectedPage.id}
                                    src={proxyUrl(selectedPage)}
                                    alt={`Halaman ${selectedPage.page_order}`}
                                    className="max-h-full max-w-full object-contain rounded shadow-2xl"
                                />
                            </div>

                            {/* Page info footer */}
                            <div className="shrink-0 border-t border-border bg-card-bg px-4 py-2 text-[10px] text-muted font-mono truncate">
                                {selectedPage.gdrive_file_id ?? "—"}
                            </div>
                        </>
                    ) : swapMode ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                            <div className="rounded-xl border border-blue-700/40 bg-blue-900/10 px-8 py-6">
                                <svg className="mx-auto mb-3 h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                                <p className="text-sm font-semibold text-foreground">Swap Mode Aktif</p>
                                <p className="mt-1 text-xs text-muted">
                                    {swapFirst
                                        ? `Halaman ${swapFirst.page_order} dipilih sebagai A. Klik halaman lain untuk swap.`
                                        : "Klik halaman pertama (A) di panel kiri"}
                                </p>
                                <button
                                    onClick={() => { setSwapMode(false); setSwapFirst(null); }}
                                    className="mt-4 rounded-lg border border-border px-4 py-2 text-xs text-muted hover:text-foreground"
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                            <div className="rounded-full bg-border/30 p-6">
                                <svg className="h-10 w-10 text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted">Pilih halaman di panel kiri untuk preview</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && <Toast msg={toast.msg} type={toast.type} />}
        </div>
    );
}
