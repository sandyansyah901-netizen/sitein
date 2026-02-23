"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadMultipleManga } from "@/app/lib/upload-api";

const JSON_EXAMPLE = JSON.stringify({
  manga_list: [
    {
      title: "One Piece",
      slug: "one-piece",
      storage_id: 1,
      type_slug: "manga",
      genre_slugs: ["action", "adventure"],
      chapters: [
        { chapter_main: 1, chapter_folder_name: "Chapter_01" },
        { chapter_main: 2, chapter_folder_name: "Chapter_02" },
      ],
    },
  ],
}, null, 2);

export default function MultipleMangaUploadPage() {
  const router = useRouter();
  const [config, setConfig] = useState(JSON_EXAMPLE);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
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
      const res = await uploadMultipleManga({ config, zip_file: zipFile, dry_run: dryRun });
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
        <h1 className="text-2xl font-bold text-foreground">Upload Multiple Manga</h1>
        <p className="mt-1 text-sm text-muted">Upload banyak manga sekaligus dari JSON config + ZIP</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">⚠️ {error}</div>}

      {result ? (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-6">
          <h2 className="mb-3 font-semibold text-emerald-400">{dryRun ? "📋 Dry Run Result" : "✅ Upload Berhasil!"}</h2>
          <pre className="overflow-auto rounded-lg bg-background p-4 text-xs font-mono text-muted max-h-96">{JSON.stringify(result, null, 2)}</pre>
          <button onClick={() => setResult(null)} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">Upload Lagi</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card-bg p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">JSON Config <span className="text-accent">*</span></label>
            <textarea value={config} onChange={(e) => setConfig(e.target.value)} rows={16} required
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