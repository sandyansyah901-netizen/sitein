"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadBulkChapters } from "@/app/lib/upload-api";

export default function BulkChapterUploadPage() {
  const router = useRouter();
  const [mangaSlug, setMangaSlug] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [startChapter, setStartChapter] = useState("");
  const [endChapter, setEndChapter] = useState("");
  const [namingPattern, setNamingPattern] = useState("");
  const [conflictStrategy, setConflictStrategy] = useState("skip");
  const [dryRun, setDryRun] = useState(false);
  const [parallel, setParallel] = useState(true);
  const [preserveFilenames, setPreserveFilenames] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) { setError("Pilih file ZIP"); return; }
    setError("");
    setResult(null);
    setIsUploading(true);
    try {
      const res = await uploadBulkChapters({
        manga_slug: mangaSlug.trim(),
        zip_file: zipFile,
        start_chapter: startChapter ? Number(startChapter) : undefined,
        end_chapter: endChapter ? Number(endChapter) : undefined,
        naming_pattern: namingPattern || undefined,
        conflict_strategy: conflictStrategy,
        dry_run: dryRun,
        parallel,
        preserve_filenames: preserveFilenames,
      });
      setResult(res as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-foreground">Bulk Upload Chapters (ZIP)</h1>
        <p className="mt-1 text-sm text-muted">Upload banyak chapter sekaligus dari ZIP. Thumbnail 16:9 di-generate otomatis untuk setiap chapter.</p>
      </div>

      <div className="mb-4 rounded-lg border border-border bg-card-bg p-4 text-xs text-muted font-mono">
        <p className="mb-1 font-semibold text-foreground">Struktur ZIP:</p>
        <pre>{`archive.zip
├── Chapter_01/
│   ├── 001.jpg
│   ├── 002.jpg
└── Chapter_02/
    └── 001.jpg`}</pre>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">⚠️ {error}</div>
      )}

      {result ? (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-6">
          <h2 className="mb-3 font-semibold text-emerald-400">
            {dryRun ? "📋 Dry Run Result" : "✅ Upload Berhasil!"}
          </h2>
          <pre className="overflow-auto rounded-lg bg-background p-4 text-xs font-mono text-muted max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-4 flex gap-3">
            <button onClick={() => setResult(null)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">
              {dryRun ? "Upload Sekarang" : "Upload Lagi"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card-bg p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Manga Slug <span className="text-accent">*</span></label>
            <input type="text" value={mangaSlug} onChange={(e) => setMangaSlug(e.target.value)}
              placeholder="contoh: one-piece" required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              File ZIP <span className="text-accent">*</span>
              {zipFile && <span className="ml-2 text-xs text-muted">({(zipFile.size / 1024 / 1024).toFixed(1)} MB)</span>}
            </label>
            <input type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] ?? null)} required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Filter: Mulai Chapter</label>
              <input type="number" min={0} value={startChapter} onChange={(e) => setStartChapter(e.target.value)}
                placeholder="Opsional"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Filter: Sampai Chapter</label>
              <input type="number" min={0} value={endChapter} onChange={(e) => setEndChapter(e.target.value)}
                placeholder="Opsional"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Naming Pattern (Regex)</label>
            <input type="text" value={namingPattern} onChange={(e) => setNamingPattern(e.target.value)}
              placeholder="Opsional, contoh: Chapter_(\d+)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Conflict Strategy</label>
            <select value={conflictStrategy} onChange={(e) => setConflictStrategy(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
              <option value="skip">Skip — lewati jika sudah ada</option>
              <option value="overwrite">Overwrite — timpa jika sudah ada</option>
              <option value="error">Error — hentikan jika ada konflik</option>
            </select>
          </div>

          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-accent" />
              <div>
                <span className="text-sm text-foreground">Dry Run</span>
                <p className="text-xs text-muted">Preview tanpa upload, lihat apa yang akan dilakukan</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={parallel} onChange={(e) => setParallel(e.target.checked)} className="h-4 w-4 accent-accent" />
              <div>
                <span className="text-sm text-foreground">Parallel Upload</span>
                <p className="text-xs text-muted">Upload chapters secara bersamaan (lebih cepat)</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={preserveFilenames} onChange={(e) => setPreserveFilenames(e.target.checked)} className="h-4 w-4 accent-accent" />
              <span className="text-sm text-foreground">Preserve original filenames</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => router.back()}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground">
              Batal
            </button>
            <button type="submit" disabled={isUploading}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {dryRun ? "Checking..." : "Uploading..."}
                </span>
              ) : dryRun ? "🔍 Dry Run" : "⬆️ Upload ZIP"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}