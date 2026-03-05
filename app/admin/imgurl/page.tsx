"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchImgUrlTokens,
    createImgUrlToken,
    updateImgUrlToken,
    deleteImgUrlToken,
    checkImgUrlTokenQuota,
    reloadImgUrlTokens,
    migrateImgUrlTokensFromFile,
    type ImgUrlToken,
    type ImgUrlTokensResponse,
    type ImgUrlTokenQuota,
} from "@/app/lib/admin-api";

// ── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${active
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-red-400"}`}
            />
            {active ? "Aktif" : "Nonaktif"}
        </span>
    );
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
    const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const color =
        pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-400" : "bg-emerald-500";
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-muted">
                {used}/{limit}
            </span>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminImgUrlPage() {
    const [data, setData] = useState<ImgUrlTokensResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newToken, setNewToken] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [newLimit, setNewLimit] = useState(30);
    const [adding, setAdding] = useState(false);

    const [editId, setEditId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editLimit, setEditLimit] = useState(30);
    const [saving, setSaving] = useState(false);

    const [quotaResults, setQuotaResults] = useState<Record<number, ImgUrlTokenQuota>>({});
    const [checkingId, setCheckingId] = useState<number | null>(null);

    const [actionMsg, setActionMsg] = useState<string | null>(null);
    const [migrating, setMigrating] = useState(false);
    const [reloading, setReloading] = useState(false);

    const showMsg = (msg: string) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(null), 4000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchImgUrlTokens();
            setData(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal memuat token");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newToken.trim()) return;
        setAdding(true);
        try {
            await createImgUrlToken(newToken.trim(), newLabel.trim() || undefined, newLimit);
            setNewToken(""); setNewLabel(""); setNewLimit(30);
            showMsg("✅ Token berhasil ditambahkan");
            await load();
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal menambahkan token"}`);
        } finally { setAdding(false); }
    };

    const handleSaveEdit = async (id: number) => {
        setSaving(true);
        try {
            await updateImgUrlToken(id, { label: editLabel, daily_limit: editLimit });
            showMsg("✅ Token diupdate"); setEditId(null);
            await load();
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal update"}`);
        } finally { setSaving(false); }
    };

    const handleToggleActive = async (t: ImgUrlToken) => {
        try {
            await updateImgUrlToken(t.id, { is_active: !t.is_active });
            showMsg(`✅ Token ${t.is_active ? "dinonaktifkan" : "diaktifkan"}`);
            await load();
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal toggle"}`);
        }
    };

    const handleDelete = async (t: ImgUrlToken) => {
        if (!confirm(`Hapus token ${t.token_preview}${t.label ? ` (${t.label})` : ""}?`)) return;
        try {
            await deleteImgUrlToken(t.id);
            showMsg("✅ Token dihapus"); await load();
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal hapus"}`);
        }
    };

    const handleCheckQuota = async (t: ImgUrlToken) => {
        setCheckingId(t.id);
        try {
            const result = await checkImgUrlTokenQuota(t.id);
            setQuotaResults((prev) => ({ ...prev, [t.id]: result }));
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal cek kuota"}`);
        } finally { setCheckingId(null); }
    };

    const handleReload = async () => {
        setReloading(true);
        try {
            const res = (await reloadImgUrlTokens()) as { message?: string };
            showMsg(res?.message ?? "✅ Reloaded"); await load();
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal reload"}`);
        } finally { setReloading(false); }
    };

    const handleMigrate = async () => {
        if (!confirm("Import token dari storage/imgurl_tokens.json ke database?\nToken yang sudah ada akan di-skip.")) return;
        setMigrating(true);
        try {
            const res = (await migrateImgUrlTokensFromFile()) as { message?: string };
            showMsg(res?.message ?? "✅ Migrasi selesai"); await load();
        } catch (e) {
            showMsg(`❌ ${e instanceof Error ? e.message : "Gagal migrasi"}`);
        } finally { setMigrating(false); }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">ImgURL Token Manager</h1>
                        <p className="mt-1 text-sm text-muted">
                            Kelola token imgurl.org untuk upload foto profil — round-robin rotation
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={handleMigrate} disabled={migrating}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50">
                            {migrating ? "Migrating…" : "📂 Import dari File JSON"}
                        </button>
                        <button onClick={handleReload} disabled={reloading}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50">
                            {reloading ? "Reloading…" : "🔄 Reload Manager"}
                        </button>
                        <button onClick={load}
                            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent/80 transition-colors">
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Action message */}
                {actionMsg && (
                    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${actionMsg.startsWith("❌")
                            ? "border-red-800/40 bg-red-900/10 text-red-400"
                            : "border-emerald-800/40 bg-emerald-900/10 text-emerald-400"
                        }`}>{actionMsg}</div>
                )}

                {/* Stats */}
                {data && (
                    <div className="mb-6 flex items-center gap-6 rounded-xl border border-border bg-card-bg px-6 py-4 flex-wrap">
                        {[
                            { label: "Total Token", val: data.total, cls: "text-foreground" },
                            { label: "Aktif", val: data.active, cls: "text-emerald-400" },
                            { label: "Round-Robin Index", val: data.rotation_index, cls: "text-foreground" },
                        ].map(({ label, val, cls }, i) => (
                            <div key={label} className="flex items-center gap-6">
                                {i > 0 && <div className="h-8 w-px bg-border" />}
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
                                    <p className={`mt-0.5 text-2xl font-bold ${cls}`}>{val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add form */}
                <div className="mb-6 rounded-xl border border-border bg-card-bg p-6">
                    <h2 className="mb-4 font-semibold text-foreground">Tambah Token Baru</h2>
                    <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">Token (sk-...)</label>
                            <input type="text" value={newToken} onChange={(e) => setNewToken(e.target.value)}
                                placeholder="sk-ggICoP68cNYmprCC8..."
                                required
                                className="w-80 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">Label (opsional)</label>
                            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="akun-1"
                                className="w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">Daily Limit</label>
                            <input type="number" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))}
                                min={1} max={10000}
                                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none" />
                        </div>
                        <button type="submit" disabled={adding || !newToken.trim()}
                            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 transition-colors disabled:opacity-50">
                            {adding ? "Menambahkan…" : "+ Tambah"}
                        </button>
                    </form>
                </div>

                {/* Token list */}
                <div className="rounded-xl border border-border bg-card-bg">
                    <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                        <h2 className="font-semibold text-foreground">Daftar Token</h2>
                        {data && <span className="text-xs text-muted">{data.tokens.length} token</span>}
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-sm text-muted">Memuat…</div>
                    ) : error ? (
                        <div className="p-8 text-center text-sm text-red-400">{error}</div>
                    ) : !data || data.tokens.length === 0 ? (
                        <div className="p-12 text-center text-sm text-muted">
                            Belum ada token. Tambahkan token baru atau klik &ldquo;Import dari File JSON&rdquo;.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {data.tokens.map((t) => (
                                <div key={t.id} className="px-6 py-4">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {/* ID */}
                                        <span className="text-xs font-mono text-muted/50 w-8 shrink-0">#{t.id}</span>

                                        {/* Token */}
                                        <span className="font-mono text-sm text-foreground">{t.token_preview}</span>

                                        {/* Label (editable) */}
                                        {editId === t.id ? (
                                            <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                                                placeholder="label…"
                                                className="w-28 rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none" />
                                        ) : (
                                            <span className="text-xs text-muted min-w-[4rem]">{t.label ?? "—"}</span>
                                        )}

                                        {/* Status badge */}
                                        <Badge active={t.is_active} />

                                        {/* Usage / limit */}
                                        {editId === t.id ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-muted">Limit:</span>
                                                <input type="number" value={editLimit} onChange={(e) => setEditLimit(Number(e.target.value))}
                                                    min={1} max={10000}
                                                    className="w-16 rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground focus:border-accent focus:outline-none" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] text-muted">Hari ini</span>
                                                <UsageBar used={t.usage_today} limit={t.daily_limit} />
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                                            {editId === t.id ? (
                                                <>
                                                    <button onClick={() => handleSaveEdit(t.id)} disabled={saving}
                                                        className="rounded px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                                        {saving ? "Saving…" : "Simpan"}
                                                    </button>
                                                    <button onClick={() => setEditId(null)}
                                                        className="rounded px-2.5 py-1 text-[10px] text-muted hover:text-foreground">
                                                        Batal
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditId(t.id); setEditLabel(t.label ?? ""); setEditLimit(t.daily_limit); }}
                                                        className="rounded px-2 py-1 text-[10px] text-muted hover:text-foreground border border-transparent hover:border-border transition-colors">
                                                        ✏️
                                                    </button>
                                                    <button onClick={() => handleToggleActive(t)}
                                                        className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-colors ${t.is_active ? "text-yellow-400 hover:bg-yellow-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}>
                                                        {t.is_active ? "⏸ Nonaktif" : "▶ Aktif"}
                                                    </button>
                                                    <button onClick={() => handleCheckQuota(t)} disabled={checkingId === t.id}
                                                        className="rounded px-2.5 py-1 text-[10px] text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50">
                                                        {checkingId === t.id ? "…" : "📊 Kuota"}
                                                    </button>
                                                    <button onClick={() => handleDelete(t)}
                                                        className="rounded px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors">
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quota result */}
                                    {quotaResults[t.id] && (
                                        <div className={`mt-3 rounded-lg border px-4 py-3 text-xs ${quotaResults[t.id].success
                                                ? "border-blue-800/30 bg-blue-900/10"
                                                : "border-red-800/30 bg-red-900/10"
                                            }`}>
                                            {quotaResults[t.id].success ? (
                                                <div className="flex flex-wrap gap-6">
                                                    {[
                                                        ["Username", quotaResults[t.id].username],
                                                        ["Upload Hari Ini", quotaResults[t.id].upload_today],
                                                        ["Total Upload", quotaResults[t.id].upload_count],
                                                        ["Storage",
                                                            quotaResults[t.id].storage_used !== undefined
                                                                ? `${(Number(quotaResults[t.id].storage_used) / 1024 / 1024).toFixed(1)} MB` +
                                                                (quotaResults[t.id].storage_limit
                                                                    ? ` / ${(Number(quotaResults[t.id].storage_limit) / 1024 / 1024).toFixed(0)} MB`
                                                                    : "")
                                                                : undefined],
                                                    ].map(([label, val]) => (
                                                        <div key={String(label)}>
                                                            <p className="text-muted">{String(label)}</p>
                                                            <p className="font-semibold text-foreground">{val !== undefined && val !== null ? String(val) : "—"}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-red-400">❌ {quotaResults[t.id].error ?? "Gagal cek kuota"}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-[10px] text-muted/40">
                    Token disimpan di database · Round-robin otomatis saat upload avatar · Klik &ldquo;Reload Manager&rdquo; setelah perubahan
                </p>
            </div>
        </div>
    );
}
