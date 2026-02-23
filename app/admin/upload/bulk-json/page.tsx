"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadBulkJson, validateJsonConfig } from "@/app/lib/upload-api";

const JSON_EXAMPLE = JSON.stringify({
  manga_slug: "one-piece",
  chapters: [
    { chapter_main: 1, chapter_sub: 0, chapter_label: "Chapter 1", chapter_folder_name: "Chapter_01" },
    { chapter_main: 2, chapter_sub: 0, chapter_label: "Chapter 2", chapter_folder_name: "Chapter_02" },
  ],
}, null, 2);

export default function BulkJsonUploadPage() {
  const router = useRouter();
  const [metadata, setMetadata] = useState(JSON_EXAMPLE);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [conflictManga, setConflictManga] = useState("skip");
  const [conflictChapter, setConflictChapter] = useState("skip");
  const [dryRun, setDryRun] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [validationResult, setValidationResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    setError("");
    setValidationResult(null);
    setIsValidating(true);
    try {
      const res = await validateJsonConfig({ config: metadata, check_existing: true });
      setValidationResult(res as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validasi gagal");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) { setError("Pilih file ZIP"); return; }
    setError("");
    setResult(null);
    setIsUploading(true);
    try {
      const res = await uploadBulkJson({
        metadata,
        zip_file: zipFile,
        conflict_strategy_manga: conflictManga,
        conflict_strategy_chapter: conflictChapter,
        dry_run: dryRun,
      });
      setResult(res as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-foreground">Bulk JSON + ZIP</h1>
        <p className="mt-1 text-sm text-muted">Upload chapters dengan metadata JSON + file ZIP</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">⚠️ {error}</div>}

      {validationResult && (
        <div className="mb-4 rounded-xl border border-blue-800/40 bg-blue-900/10 p-4">
          <h3 className="mb-2 font-semibold text-blue-400">Validation Result</h3>
          <pre className="overflow-auto text-xs font-mono text-muted max-h-40">{JSON.stringify(validationResult, null, 2)}</pre>
        </div>
      )}

      {result ? (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-6">
          <h2 className="mb-3 font-semibold text-emerald-400">{dryRun ? "📋 Dry Run Result" : "✅ Upload Berhasil!"}</h2>
          <pre className="overflow-auto rounded-lg bg-background p-4 text-xs font-mono text-muted max-h-96">{JSON.stringify(result, null, 2)}</pre>
          <button onClick={() => setResult(null)} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">Upload Lagi</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card-bg p-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">JSON Metadata <span className="text-accent">*</span></label>
              <button type="button" onClick={handleValidate} disabled={isValidating}
                className="text-xs text-accent hover:underline disabled:opacity-50">
                {isValidating ? "Validating..." : "✓ Validate JSON"}
              </button>
            </div>
            <textarea value={metadata} onChange={(e) => setMetadata(e.target.value)} rows={12} required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-mono text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y" />
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">Conflict Manga</label>
              <select value={conflictManga} onChange={(e) => setConflictManga(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
                <option value="skip">Skip</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Conflict Chapter</label>
              <select value={conflictChapter} onChange={(e) => setConflictChapter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
                <option value="skip">Skip</option>
                <option value="overwrite">Overwrite</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-accent" />
            <div>
              <span className="text-sm text-foreground">Dry Run</span>
              <p className="text-xs text-muted">Preview tanpa upload</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button type="button" onClick={() => router.back()}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground">Batal</button>
            <button type="submit" disabled={isUploading}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {dryRun ? "Checking..." : "Uploading..."}
                </span>
              ) : dryRun ? "🔍 Dry Run" : "⬆️ Upload"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}