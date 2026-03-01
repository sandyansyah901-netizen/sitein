"use client";

import { useEffect, useState } from "react";
import {
    fetchImgurlTokenStatus,
    reloadImgurlTokens,
    type ImgurlTokenStatus,
    type ImgurlTokenInfo,
} from "@/app/lib/admin-api";
import { RefreshCw, Key, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

function TokenRow({ t }: { t: ImgurlTokenInfo }) {
    const usePct = Math.min((t.usage_today / t.limit) * 100, 100);
    return (
        <div className={`rounded-xl border p-4 transition-colors ${t.over_limit ? "border-yellow-800/40 bg-yellow-900/10" : "border-border bg-card-bg"}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-border text-[10px] font-bold text-muted">{t.index}</span>
                    <code className="text-xs text-foreground">{t.token_preview}</code>
                </div>
                {t.over_limit ? (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-900/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                        <AlertCircle className="h-3 w-3" /> Over limit
                    </span>
                ) : (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-900/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> OK
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                        className={`h-full rounded-full transition-all ${t.over_limit ? "bg-yellow-500" : usePct > 70 ? "bg-orange-500" : "bg-emerald-500"}`}
                        style={{ width: `${usePct}%` }}
                    />
                </div>
                <span className="shrink-0 text-[11px] text-muted">{t.usage_today} / {t.limit} hari ini</span>
            </div>
        </div>
    );
}

export default function AdminImgurlPage() {
    const [data, setData] = useState<ImgurlTokenStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReloading, setIsReloading] = useState(false);
    const [error, setError] = useState("");
    const [reloadMsg, setReloadMsg] = useState("");

    const load = async () => {
        setIsLoading(true);
        setError("");
        try {
            setData(await fetchImgurlTokenStatus());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal memuat status token");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReload = async () => {
        setIsReloading(true);
        setReloadMsg("");
        setError("");
        try {
            const result = await reloadImgurlTokens();
            setData(result);
            setReloadMsg(`✅ Berhasil reload: ${result.total_tokens} token aktif`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal reload token");
        } finally {
            setIsReloading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const totalUsageToday = data?.tokens.reduce((s, t) => s + t.usage_today, 0) ?? 0;
    const overLimitCount = data?.tokens.filter((t) => t.over_limit).length ?? 0;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">imgurl.org Token Manager</h1>
                <p className="mt-1 text-sm text-muted">Monitor usage dan kelola token API untuk upload avatar</p>
            </div>

            {/* ── Summary Cards ─────────────────────────────────────────────────── */}
            {data && (
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: "Total Token", value: data.total_tokens, color: "text-foreground" },
                        { label: "Strategi", value: data.rotation_strategy, color: "text-blue-400" },
                        { label: "Upload Hari Ini", value: totalUsageToday, color: "text-foreground" },
                        { label: "Over Limit", value: overLimitCount, color: overLimitCount > 0 ? "text-yellow-400" : "text-emerald-400" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl border border-border bg-card-bg p-4">
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="mt-0.5 text-xs text-muted">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Alerts ────────────────────────────────────────────────────────── */}
            {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            {reloadMsg && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-800/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{reloadMsg}</span>
                </div>
            )}

            {/* ── Token List ──────────────────────────────────────────────────── */}
            <div className="mb-6 rounded-xl border border-border bg-card-bg overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-accent" />
                        <h2 className="font-semibold text-foreground">Token Status</h2>
                        {data && (
                            <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">
                                next: #{data.current_index + 1}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={load}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleReload}
                            disabled={isReloading}
                            className="flex items-center gap-1.5 rounded-lg border border-blue-800/40 bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-900/30 disabled:opacity-50"
                        >
                            <RotateCcw className={`h-3 w-3 ${isReloading ? "animate-spin" : ""}`} />
                            {isReloading ? "Reloading..." : "Reload dari File"}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-xl bg-border" />
                            ))}
                        </div>
                    ) : !data ? (
                        <p className="text-center text-sm text-muted py-8">Tidak ada data</p>
                    ) : data.tokens.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
                            <Key className="mx-auto mb-2 h-8 w-8 opacity-30" />
                            <p>Tidak ada token terdaftar</p>
                            <p className="text-xs mt-1">Tambahkan token di <code className="rounded bg-border px-1">storage/imgurl_tokens.json</code> lalu klik Reload</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.tokens.map((t) => <TokenRow key={t.index} t={t} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Info ──────────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card-bg p-6">
                <h2 className="mb-3 font-semibold text-foreground">Cara Kerja</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 text-xs text-muted">
                        <p className="font-semibold text-foreground">Round-Robin Rotation</p>
                        <p>Setiap upload avatar memakai token berikutnya secara bergilir — tidak menunggu token mencapai limit 30/hari.</p>
                        <p>Token yang <span className="text-yellow-400">over limit</span> tetap dipakai (soft limit — hanya warning di log).</p>
                    </div>
                    <div className="space-y-2 text-xs text-muted">
                        <p className="font-semibold text-foreground">File Konfigurasi</p>
                        <code className="block rounded bg-background p-2 text-[10px] leading-relaxed">
                            storage/imgurl_tokens.json<br />
                            {`{"tokens": ["sk-TOKEN1", "sk-TOKEN2"]}`}
                        </code>
                        <p>Setelah edit file, klik <span className="text-blue-400 font-semibold">Reload dari File</span> tanpa perlu restart server.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
