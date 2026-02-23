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

export default function SmartImportPage() {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [typeSlug, setTypeSlug] = useState("");
  const [defaultStatus, setDefaultStatus] = useState("ongoing");
  const [dryRun, setDryRun] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // ── Progress list (kanan) ────────────────────────────────────
  const [progresses, setProgresses] = useState<ProgressEntry[]>([]);
  const pollingRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // ── Misc ─────────────────────────────────────────────────────
  const [types, setTypes] = useState<MangaType[]>([]);
  const [exampleJson, setExampleJson] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMangaTypes().then(setTypes).catch(() => {});
  }, []);

  // Cleanup all pollers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(clearInterval);
    };
  }, []);

  // ── Poll progress for one upload_id ─────────────────────────
  const startPolling = useCallback((upload_id: string) => {
    // Jangan polling dua kali untuk id yg sama
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
        // Jika gagal fetch progress, hentikan polling
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
    }, 1500); // poll tiap 1.5 detik

    pollingRefs.current[upload_id] = interval;
  }, []);

  // ── Handle Example ───────────────────────────────────────────
  const handleShowExample = async () => {
    if (!exampleJson) {
      try {
        const ex = await fetchSmartImportExample();
        setExampleJson(JSON.stringify(ex, null, 2));
      } catch {}
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
    setIsUploading(true);

    // Catat entry progress dengan status "uploading"
    const tempId = `temp-${Date.now()}`;
    const filename = zipFile.name;

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

      // Coba ambil upload_id dari response
      const upload_id =
        (res?.upload_id as string) ||
        (res?.id as string) ||
        tempId;

      // Update entry: ganti tempId → upload_id yg asli
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

      // Mulai polling jika upload_id tersedia
      if (upload_id && upload_id !== tempId) {
        startPolling(upload_id);
      } else {
        // Jika API langsung return hasil (sync), tandai selesai
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
      setProgresses((prev) =>
        prev.map((p) =>
          p.upload_id === tempId
            ? { ...p, status: "failed", errors: [msg], progress: 0 }
            : p
        )
      );
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

        {/* Struktur ZIP */}
        <div className="mb-4 rounded-lg border border-border bg-card-bg p-4 text-xs font-mono text-muted">
          <p className="mb-1 font-semibold text-foreground">Struktur ZIP:</p>
          <pre>{`upload.zip
├── One Piece/
│   ├── cover.jpg
│   ├── description.txt
│   ├── genres.txt
│   ├── Chapter_01/
│   │   ├── 001.jpg
│   │   └── 002.jpg
│   └── Chapter_02/
└── Naruto/`}</pre>
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tipe Default</label>
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">Status Default</label>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
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
              <p className="text-xs text-muted">Preview tanpa upload</p>
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
              ) : dryRun ? "🔍 Dry Run" : "✨ Smart Import"}
            </button>
          </div>
        </form>
      </div>

      {/* ── KANAN: Progress Panel ────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            📋 Antrian Upload
          </h2>
          {progresses.length > 0 && (
            <button
              onClick={() => {
                // Hapus semua yg sudah selesai/gagal
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
      </div>
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
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${
            !isDone && entry.status !== "error" ? "animate-pulse" : ""
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
            {showDetail ? "▾ Sembunyikan" : "▸ Lihat detail"}
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