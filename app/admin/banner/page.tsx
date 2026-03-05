"use client";

import { useEffect, useState, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BannerSlot {
    id: number;
    slot_index: number;
    mode: "auto" | "custom";
    custom_image_path: string | null;
    custom_image_url: string | null;
    custom_title: string | null;
    custom_subtitle: string | null;
    custom_link: string | null;
    is_active: boolean;
    updated_at: string | null;
}

// ─── API helpers (inline — simple enough) ──────────────────────────────────

const API_BASE = "http://127.0.0.1:8000/api/v1";
function token() { return typeof window !== "undefined" ? localStorage.getItem("komik_token") ?? "" : ""; }
function authOpts(extra?: RequestInit): RequestInit {
    return { ...extra, headers: { Authorization: `Bearer ${token()}`, ...(extra?.headers ?? {}) } };
}
async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(url, authOpts(opts));
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
    return res.json() as Promise<T>;
}

// ─── Component ───────────────────────────────────────────────────────────────

const SLOT_LABELS = ["Slot 1 (Kiri)", "Slot 2 (Tengah)", "Slot 3 (Kanan)"];

export default function AdminBannerPage() {
    const [slots, setSlots] = useState<BannerSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingIdx, setSavingIdx] = useState<number | null>(null);
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Local edits buffer
    const [edits, setEdits] = useState<Record<number, Partial<BannerSlot>>>({});
    const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const loadSlots = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<{ slots: BannerSlot[] }>(`${API_BASE}/admin/banners`);
            setSlots(data.slots);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal load banner slots");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSlots(); }, []);

    const getEdit = (idx: number) => edits[idx] ?? {};
    const setEdit = (idx: number, patch: Partial<BannerSlot>) =>
        setEdits((prev) => ({ ...prev, [idx]: { ...prev[idx], ...patch } }));

    const handleSave = async (slot: BannerSlot) => {
        const edit = getEdit(slot.slot_index);
        const mode = edit.mode ?? slot.mode;
        const params = new URLSearchParams({
            mode,
            is_active: String(edit.is_active ?? slot.is_active),
            ...(edit.custom_title !== undefined ? { custom_title: edit.custom_title ?? "" } : slot.custom_title ? { custom_title: slot.custom_title } : {}),
            ...(edit.custom_subtitle !== undefined ? { custom_subtitle: edit.custom_subtitle ?? "" } : slot.custom_subtitle ? { custom_subtitle: slot.custom_subtitle } : {}),
            ...(edit.custom_link !== undefined ? { custom_link: edit.custom_link ?? "" } : slot.custom_link ? { custom_link: slot.custom_link } : {}),
        });

        setSavingIdx(slot.slot_index);
        try {
            await apiFetch(`${API_BASE}/admin/banners/${slot.slot_index}?${params}`, { method: "PUT" });
            setSuccessMsg(`Slot ${slot.slot_index + 1} berhasil disimpan`);
            setEdits((prev) => { const n = { ...prev }; delete n[slot.slot_index]; return n; });
            await loadSlots();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal simpan");
        } finally {
            setSavingIdx(null);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    const handleUpload = async (slot: BannerSlot, file: File) => {
        setUploadingIdx(slot.slot_index);
        const fd = new FormData();
        fd.append("image", file);
        try {
            await fetch(`${API_BASE}/admin/banners/${slot.slot_index}/image`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token()}` },
                body: fd,
            }).then(async (r) => {
                if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${r.status}`); }
            });
            setSuccessMsg(`Gambar slot ${slot.slot_index + 1} berhasil diupload`);
            await loadSlots();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal upload gambar");
        } finally {
            setUploadingIdx(null);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    const handleDeleteImage = async (slot: BannerSlot) => {
        if (!confirm(`Hapus gambar slot ${slot.slot_index + 1} dan reset ke mode Auto?`)) return;
        setDeletingIdx(slot.slot_index);
        try {
            await apiFetch(`${API_BASE}/admin/banners/${slot.slot_index}/image`, { method: "DELETE" });
            setSuccessMsg(`Gambar slot ${slot.slot_index + 1} dihapus, direset ke Auto`);
            await loadSlots();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal hapus gambar");
        } finally {
            setDeletingIdx(null);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Manajemen Hero Banner</h1>
                <p className="mt-1 text-sm text-muted">
                    Atur 3 slot banner di halaman utama. Mode <strong>Auto</strong> = tampilkan cover manga terbaru secara otomatis.
                    Mode <strong>Custom</strong> = gambar yang kamu upload sendiri.
                </p>
            </div>

            {error && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="ml-4 text-muted hover:text-foreground">Tutup</button>
                </div>
            )}
            {successMsg && (
                <div className="mb-4 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
                    {successMsg}
                </div>
            )}

            {loading ? (
                <div className="grid gap-4 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-xl border border-border bg-card-bg p-5 animate-pulse">
                            <div className="h-4 w-24 rounded bg-border mb-4" />
                            <div className="h-40 w-full rounded bg-border mb-4" />
                            <div className="h-8 w-full rounded bg-border" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                    {slots.map((slot) => {
                        const edit = getEdit(slot.slot_index);
                        const currentMode = edit.mode ?? slot.mode;
                        const isDirty = Object.keys(edit).length > 0;

                        return (
                            <div key={slot.slot_index} className="rounded-xl border border-border bg-card-bg overflow-hidden flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                    <span className="text-sm font-semibold text-foreground">
                                        {SLOT_LABELS[slot.slot_index]}
                                    </span>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setEdit(slot.slot_index, { mode: "auto" })}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${currentMode === "auto"
                                                    ? "bg-accent text-white"
                                                    : "border border-border text-muted hover:text-foreground"
                                                }`}
                                        >
                                            Auto
                                        </button>
                                        <button
                                            onClick={() => setEdit(slot.slot_index, { mode: "custom" })}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${currentMode === "custom"
                                                    ? "bg-accent text-white"
                                                    : "border border-border text-muted hover:text-foreground"
                                                }`}
                                        >
                                            Custom
                                        </button>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="relative h-44 bg-border overflow-hidden">
                                    {slot.custom_image_url && currentMode === "custom" ? (
                                        <img
                                            src={`http://127.0.0.1:8000${slot.custom_image_url}`}
                                            alt="Banner preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center flex-col gap-2 text-muted">
                                            <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs">
                                                {currentMode === "auto" ? "Otomatis (cover manga terbaru)" : "Belum ada gambar"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Custom fields */}
                                <div className="flex-1 p-4 space-y-3">
                                    {currentMode === "custom" && (
                                        <>
                                            {/* Upload gambar */}
                                            <div>
                                                <label className="block text-xs text-muted mb-1.5">Gambar Banner</label>
                                                <input
                                                    ref={fileRefs[slot.slot_index]}
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.webp"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleUpload(slot, f);
                                                    }}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => fileRefs[slot.slot_index].current?.click()}
                                                        disabled={uploadingIdx === slot.slot_index}
                                                        className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-muted hover:border-accent hover:text-foreground disabled:opacity-50 transition-colors"
                                                    >
                                                        {uploadingIdx === slot.slot_index ? "Mengupload..." : slot.custom_image_url ? "Ganti Gambar" : "Upload Gambar"}
                                                    </button>
                                                    {slot.custom_image_url && (
                                                        <button
                                                            onClick={() => handleDeleteImage(slot)}
                                                            disabled={deletingIdx === slot.slot_index}
                                                            className="rounded-lg p-2 text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                                                            title="Hapus gambar & reset ke Auto"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Judul */}
                                            <div>
                                                <label className="block text-xs text-muted mb-1">Judul</label>
                                                <input
                                                    type="text"
                                                    placeholder="Judul banner (opsional)"
                                                    value={edit.custom_title ?? slot.custom_title ?? ""}
                                                    onChange={(e) => setEdit(slot.slot_index, { custom_title: e.target.value })}
                                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
                                                />
                                            </div>

                                            {/* Subtitle */}
                                            <div>
                                                <label className="block text-xs text-muted mb-1">Subtitle</label>
                                                <input
                                                    type="text"
                                                    placeholder="Subtitle (opsional)"
                                                    value={edit.custom_subtitle ?? slot.custom_subtitle ?? ""}
                                                    onChange={(e) => setEdit(slot.slot_index, { custom_subtitle: e.target.value })}
                                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
                                                />
                                            </div>

                                            {/* Link */}
                                            <div>
                                                <label className="block text-xs text-muted mb-1">Link URL (saat diklik)</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://... atau /manhwa/judul-manga"
                                                    value={edit.custom_link ?? slot.custom_link ?? ""}
                                                    onChange={(e) => setEdit(slot.slot_index, { custom_link: e.target.value })}
                                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {currentMode === "auto" && (
                                        <p className="text-xs text-muted italic py-2">
                                            Slot ini akan otomatis menampilkan cover dari {slot.slot_index === 0 ? "manga" : slot.slot_index === 1 ? "manhwa" : "manhua"} yang paling baru diupdate.
                                        </p>
                                    )}
                                </div>

                                {/* Save button */}
                                <div className="border-t border-border px-4 py-3">
                                    <button
                                        onClick={() => handleSave(slot)}
                                        disabled={savingIdx === slot.slot_index || (!isDirty && slot.mode === currentMode)}
                                        className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${isDirty
                                                ? "bg-accent text-white hover:bg-accent-hover"
                                                : "border border-border text-muted cursor-default"
                                            } disabled:opacity-50`}
                                    >
                                        {savingIdx === slot.slot_index ? "Menyimpan..." : isDirty ? "Simpan Perubahan" : "Tersimpan"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
