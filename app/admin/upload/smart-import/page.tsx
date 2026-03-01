"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  uploadSmartImport,
  fetchSmartImportExample,
  fetchUploadProgress,
} from "@/app/lib/upload-api";
import { fetchMangaTypes, type MangaType } from "@/app/lib/api";

interface ProgressEntry {
  upload_id: string;
  filename: string;
  status: string;
  progress: number;
  current_file?: string;
  total_files?: number;
  processed_files?: number;
  errors?: string[];
  result?: Record<string, unknown>;
  startedAt: number;
}

// Dry run preview item shape (dari docs v3)
interface DryRunItem {
  title: string;
  slug: string;
  exists: boolean;
  has_cover: boolean;
  cover_format?: string;
  has_description: boolean;
  genres: string[];
  alt_titles: { title: string; lang: string }[];
  detected_type?: string;
  type_source?: string;
  detected_status?: string;
  status_from_file?: boolean;
  total_chapters: number;
  chapters: { chapter_label: string; file_count: number; has_preview: boolean }[];
}

interface DryRunResult {
  dry_run: boolean;
  total_manga: number;
  preview: DryRunItem[];
}

export default function SmartImportPage() {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [typeSlug, setTypeSlug] = useState("");
  const [defaultStatus, setDefaultStatus] = useState("ongoing");
  const [dryRun, setDryRun] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // ── Dry run preview result ───────────────────────────────────
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);

  // ── Progress list (kanan) ────────────────────────────────────
  const [progresses, setProgresses] = useState<ProgressEntry[]>([]);
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // ── Misc ─────────────────────────────────────────────────────
  const [types, setTypes] = useState<MangaType[]>([]);
  const [exampleJson, setExampleJson] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMangaTypes().then(setTypes).catch(() => { });
  }, []);

  // Cleanup all pollers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  // ── Poll progress for one upload_id ─────────────────────────
  const startPolling = useCallback((upload_id: string) => {
    if (pollingRefs.current[upload_id]) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchUploadProgress(upload_id);

        setProgresses((prev) =>
          prev.map((p) =>
            p.upload_id === upload_id
              ? {
                ...p,
                status: data.status,
                progress: data.progress,
                current_file: data.current_file,
                total_files: data.total_files,
                processed_files: data.processed_files,
                errors: data.errors,
              }
              : p
          )
        );

        const done =
          data.status === "completed" ||
          data.status === "failed" ||
          data.status === "error";

        if (done) {
          clearInterval(interval);
          delete pollingRefs.current[upload_id];
        }
      } catch {
        clearInterval(interval);
        delete pollingRefs.current[upload_id];
        setProgresses((prev) =>
          prev.map((p) =>
            p.upload_id === upload_id
              ? { ...p, status: "error", errors: ["Gagal mengambil progress"] }
              : p
          )
        );
      }
    }, 1500);

    pollingRefs.current[upload_id] = interval;
  }, []);

  // ── Handle Example ───────────────────────────────────────────
  const handleShowExample = async () => {
    if (!exampleJson) {
      try {
        const ex = await fetchSmartImportExample();
        setExampleJson(JSON.stringify(ex, null, 2));
      } catch { }
    }
    setShowExample((v) => !v);
  };

  // ── Handle Submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      setError("Pilih file ZIP");
      return;
    }
    setError("");
    setDryRunResult(null);
    setIsUploading(true);

    const tempId = `temp-${Date.now()}`;
    const filename = zipFile.name;

    if (!dryRun) {
      setProgresses((prev) => [
        {
          upload_id: tempId,
          filename,
          status: "uploading",
          progress: 0,
          startedAt: Date.now(),
        },
        ...prev,
      ]);
    }

    // ✅ Reset form SEGERA supaya user bisa upload lagi
    setZipFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);

    try {
      const res = await uploadSmartImport({
        zip_file: zipFile,
        storage_id: 1,
        type_slug: typeSlug || undefined,
        default_status: defaultStatus,
        dry_run: dryRun,
      }) as Record<string, unknown>;

      // ── Dry run: tampilkan preview ─────────────────────────
      if (dryRun) {
        if (res?.dry_run === true && res?.preview) {
          setDryRunResult(res as unknown as DryRunResult);
        } else {
          setDryRunResult({
            dry_run: true,
            total_manga: 0,
            preview: [],
          });
        }
        return;
      }

      // ── Actual import: progress tracking ──────────────────
      const upload_id =
        (res?.upload_id as string) ||
        (res?.id as string) ||
        tempId;

      setProgresses((prev) =>
        prev.map((p) =>
          p.upload_id === tempId
            ? {
              ...p,
              upload_id,
              status: (res?.status as string) ?? "processing",
              progress: (res?.progress as number) ?? 10,
              result: res,
            }
            : p
        )
      );

      if (upload_id && upload_id !== tempId) {
        startPolling(upload_id);
      } else {
        setProgresses((prev) =>
          prev.map((p) =>
            p.upload_id === tempId
              ? { ...p, status: "completed", progress: 100, result: res }
              : p
          )
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import gagal";
      if (dryRun) {
        setError(msg);
      } else {
        setProgresses((prev) =>
          prev.map((p) =>
            p.upload_id === tempId
              ? { ...p, status: "failed", errors: [msg], progress: 0 }
              : p
          )
        );
      }
    }
  };

  // ── Remove entry dari list ───────────────────────────────────
  const removeEntry = (upload_id: string) => {
    if (pollingRefs.current[upload_id]) {
      clearInterval(pollingRefs.current[upload_id]);
      delete pollingRefs.current[upload_id];
    }
    setProgresses((prev) => prev.filter((p) => p.upload_id !== upload_id));
  };

  return (
    <div className="flex gap-6">
      {/* ── KIRI: Form ──────────────────────────────────────────── */}
      <div className="w-full max-w-xl flex-shrink-0">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-foreground">✨ Smart Import</h1>
          <p className="mt-1 text-sm text-muted">
            Auto-import manga dari ZIP. Bisa kirim beberapa ZIP sekaligus!
          </p>
        </div>

        {/* Struktur ZIP — v3 */}
        <div className="mb-4 rounded-lg border border-border bg-card-bg p-4 text-xs font-mono text-muted">
          <p className="mb-1 font-semibold text-foreground">Struktur ZIP (v3):</p>
          <pre>{`upload.zip
├── One Piece/
│   ├── cover.webp
│   ├── description.txt
│   ├── genres.txt
│   ├── status.txt       ✨ (Ongoing/Completed/Hiatus/Cancelled)
│   ├── type.txt         ✨ (Manga/Manhwa/Manhua/Novel/…)
│   ├── alt_titles.txt   (judul|lang_code per baris)
│   ├── Chapter 01/
│   │   ├── page_001.webp
│   │   └── preview.webp (optional thumbnail)
│   └── Chapter 02/
└── Tower of God/
    ├── status.txt
    ├── type.txt
    └── Chapter 01/`}</pre>
          <div className="mt-2 space-y-0.5 text-[10px] text-border">
            <p>• <span className="text-accent">status.txt</span> → override "Status Default" di bawah (per manga)</p>
            <p>• <span className="text-accent">type.txt</span> → override "Tipe Default" di bawah (per manga)</p>
            <p>• <span className="text-accent">preview.webp</span> → thumbnail chapter (jika tidak ada, pakai halaman pertama)</p>
          </div>
        </div>

        {/* Example toggle */}
        <button
          onClick={handleShowExample}
          className="mb-4 flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showExample ? "Sembunyikan" : "Lihat"} contoh dari API
        </button>
        {showExample && exampleJson && (
          <div className="mb-4 rounded-lg border border-border bg-background p-4">
            <pre className="max-h-48 overflow-auto text-[10px] font-mono text-muted">
              {exampleJson}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-border bg-card-bg p-6"
        >
          {/* ZIP */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              File ZIP <span className="text-accent">*</span>
              {zipFile && (
                <span className="ml-2 text-xs text-muted">
                  ({(zipFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              )}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
          </div>

          {/* Storage (fixed) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Storage</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5">
              <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span className="text-sm text-muted">Storage #1</span>
              <span className="ml-auto rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Active
              </span>
            </div>
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Tipe Default
              </label>
              <p className="mb-1.5 text-[10px] text-muted">
                Jika ZIP punya <code className="text-accent">type.txt</code>, itu yang dipakai
              </p>
              <select
                value={typeSlug}
                onChange={(e) => setTypeSlug(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">Auto detect</option>
                {types.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Status Default
              </label>
              <p className="mb-1.5 text-[10px] text-muted">
                Jika ZIP punya <code className="text-accent">status.txt</code>, itu yang dipakai
              </p>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dry Run */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <div>
              <span className="text-sm text-foreground">Dry Run</span>
              <p className="text-xs text-muted">Preview manga yang akan diimport (tidak upload)</p>
            </div>
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !zipFile}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mengirim...
                </span>
              ) : dryRun ? "🔍 Dry Run Preview" : "✨ Smart Import"}
            </button>
          </div>
        </form>
      </div>

      {/* ── KANAN: Progress / Dry Run Panel ──────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* ── Dry Run Result ──────────────────────────────────────── */}
        {dryRunResult && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                🔍 Dry Run Preview
              </h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-yellow-500/10 px-3 py-0.5 text-xs font-semibold text-yellow-400">
                  {dryRunResult.total_manga} manga ditemukan
                </span>
                <button
                  onClick={() => setDryRunResult(null)}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {dryRunResult.preview.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
                  Tidak ada manga ditemukan dalam ZIP
                </div>
              ) : (
                dryRunResult.preview.map((item, i) => (
                  <DryRunCard key={i} item={item} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Upload Progress ─────────────────────────────────────── */}
        {!dryRunResult && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                📋 Antrian Upload
              </h2>
              {progresses.length > 0 && (
                <button
                  onClick={() => {
                    const toRemove = progresses.filter(
                      (p) =>
                        p.status === "completed" ||
                        p.status === "failed" ||
                        p.status === "error"
                    );
                    toRemove.forEach((p) => removeEntry(p.upload_id));
                  }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Bersihkan selesai
                </button>
              )}
            </div>

            {progresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                <svg className="mb-3 h-10 w-10 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-muted">Belum ada upload</p>
                <p className="mt-1 text-xs text-border">Upload ZIP untuk melihat progress di sini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {progresses.map((entry) => (
                  <ProgressCard
                    key={entry.upload_id}
                    entry={entry}
                    onRemove={() => removeEntry(entry.upload_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: DryRunCard ─────────────────────────────────────────────────
function DryRunCard({ item }: { item: DryRunItem }) {
  const [open, setOpen] = useState(false);

  const typeSourceLabel: Record<string, string> = {
    "type.txt": "type.txt ✨",
    "file_marker": "file marker",
    "api_param": "default param",
  };

  const statusBadge = item.exists
    ? { label: "Sudah Ada", cls: "bg-yellow-500/10 text-yellow-400" }
    : { label: "Baru", cls: "bg-emerald-500/10 text-emerald-400" };

  return (
    <div className="rounded-xl border border-border bg-card-bg p-4">
      {/* Row 1: title + badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted font-mono">{item.slug}</p>
        </div>
      </div>

      {/* Row 2: type + status badges */}
      <div className="mb-3 flex flex-wrap gap-2">
        {item.detected_type && (
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            {item.detected_type}
            {item.type_source && (
              <span className="ml-1 opacity-70">
                via {typeSourceLabel[item.type_source] ?? item.type_source}
              </span>
            )}
          </span>
        )}
        {item.detected_status && (
          <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
            {item.detected_status}
            {item.status_from_file && <span className="ml-1 opacity-70">via status.txt ✨</span>}
          </span>
        )}
        {item.has_cover && (
          <span className="rounded bg-card-bg border border-border px-2 py-0.5 text-[10px] text-muted">
            🖼️ cover{item.cover_format}
          </span>
        )}
        {item.has_description && (
          <span className="rounded bg-card-bg border border-border px-2 py-0.5 text-[10px] text-muted">
            📄 desc
          </span>
        )}
        {item.genres.length > 0 && (
          <span className="rounded bg-card-bg border border-border px-2 py-0.5 text-[10px] text-muted">
            🏷️ {item.genres.length} genre
          </span>
        )}
        {item.alt_titles.length > 0 && (
          <span className="rounded bg-card-bg border border-border px-2 py-0.5 text-[10px] text-muted">
            🌐 {item.alt_titles.length} alt title
          </span>
        )}
      </div>

      {/* Row 3: chapters summary + toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          📁 {item.total_chapters} chapter
          {item.chapters.filter(c => c.has_preview).length > 0 && (
            <span className="ml-1 text-accent">
              · {item.chapters.filter(c => c.has_preview).length} preview
            </span>
          )}
        </span>
        {item.chapters.length > 0 && (
          <button
            onClick={() => setOpen(v => !v)}
            className="text-xs text-accent hover:underline"
          >
            {open ? "▾ Sembunyikan" : "▸ Detail chapter"}
          </button>
        )}
      </div>

      {/* Chapter detail */}
      {open && item.chapters.length > 0 && (
        <div className="mt-2 space-y-1 rounded-lg bg-background px-3 py-2">
          {item.chapters.map((ch, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-muted">
              <span>{ch.chapter_label}</span>
              <span className="flex items-center gap-2">
                <span>{ch.file_count} hal</span>
                {ch.has_preview && (
                  <span className="text-accent">🖼️ preview</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-component: ProgressCard ──────────────────────────────────────────────
function ProgressCard({
  entry,
  onRemove,
}: {
  entry: ProgressEntry;
  onRemove: () => void;
}) {
  const isDone =
    entry.status === "completed" ||
    entry.status === "failed" ||
    entry.status === "error";

  const statusColor = {
    uploading: "text-blue-400",
    processing: "text-yellow-400",
    completed: "text-emerald-400",
    failed: "text-red-400",
    error: "text-red-400",
  }[entry.status] ?? "text-muted";

  const statusLabel = {
    uploading: "⬆️ Mengirim...",
    processing: "⚙️ Memproses...",
    completed: "✅ Selesai",
    failed: "❌ Gagal",
    error: "❌ Error",
  }[entry.status] ?? entry.status;

  const barColor = {
    uploading: "bg-blue-500",
    processing: "bg-yellow-500",
    completed: "bg-emerald-500",
    failed: "bg-red-500",
    error: "bg-red-500",
  }[entry.status] ?? "bg-accent";

  const [showDetail, setShowDetail] = useState(false);

  // Parse result summary jika ada
  const result = entry.result as Record<string, unknown> | undefined;
  const importedCount = result?.imported as number | undefined;
  const failedCount = result?.failed as number | undefined;
  const totalManga = result?.total_manga as number | undefined;

  return (
    <div className="rounded-xl border border-border bg-card-bg p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {entry.filename}
          </p>
          <p className={`mt-0.5 text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 rounded p-1 text-muted hover:bg-border hover:text-foreground"
          title="Hapus"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${!isDone && entry.status !== "error" ? "animate-pulse" : ""
            }`}
          style={{ width: `${entry.progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{entry.progress}%</span>
        {entry.total_files && (
          <span>
            {entry.processed_files ?? 0} / {entry.total_files} file
          </span>
        )}
        {entry.current_file && !isDone && (
          <span className="max-w-[140px] truncate">{entry.current_file}</span>
        )}
      </div>

      {/* Summary badge on complete */}
      {entry.status === "completed" && totalManga !== undefined && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            ✅ {importedCount ?? 0} diimport
          </span>
          {(failedCount ?? 0) > 0 && (
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              ❌ {failedCount} gagal
            </span>
          )}
          <span className="rounded bg-card-bg border border-border px-2 py-0.5 text-[10px] text-muted">
            {totalManga} total manga
          </span>
        </div>
      )}

      {/* Errors */}
      {entry.errors && entry.errors.length > 0 && (
        <div className="mt-2 rounded-lg bg-red-900/20 px-3 py-2">
          {entry.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Result detail (completed) */}
      {entry.status === "completed" && entry.result && (
        <div className="mt-3">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            {showDetail ? "▾ Sembunyikan" : "▸ Lihat detail JSON"}
          </button>
          {showDetail && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-background p-3 text-[10px] font-mono text-muted">
              {JSON.stringify(entry.result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}