"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadSingleChapter } from "@/app/lib/upload-api";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function SingleChapterUploadPage() {
  const router = useRouter();
  const [mangaSlug, setMangaSlug] = useState("");
  const [chapterMain, setChapterMain] = useState("");
  const [chapterSub, setChapterSub] = useState("0");
  const [chapterLabel, setChapterLabel] = useState("");
  const [folderName, setFolderName] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [preserveFilenames, setPreserveFilenames] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const handleChapterMainChange = (val: string) => {
    setChapterMain(val);
    if (val) {
      const sub = chapterSub !== "0" ? `-${chapterSub.padStart(2, "0")}` : "";
      setChapterLabel(`Chapter ${val}${sub}`);
      setFolderName(`Chapter_${val.padStart(3, "0")}`);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const sorted = selected.sort((a, b) => a.name.localeCompare(b.name));
    setFiles(sorted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { setError("Pilih minimal 1 file gambar"); return; }
    setError("");
    setResult(null);
    setIsUploading(true);
    try {
      const res = await uploadSingleChapter({
        manga_slug: mangaSlug.trim(),
        chapter_main: Number(chapterMain),
        chapter_sub: chapterSub ? Number(chapterSub) : undefined,
        chapter_label: chapterLabel.trim(),
        chapter_folder_name: folderName.trim(),
        volume_number: volumeNumber ? Number(volumeNumber) : undefined,
        files,
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
        <h1 className="text-2xl font-bold text-foreground">Upload Single Chapter</h1>
        <p className="mt-1 text-sm text-muted">Upload satu chapter dengan file gambar. Thumbnail 16:9 akan di-generate otomatis dari page 1.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">⚠️ {error}</div>
      )}

      {result ? (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-6">
          <h2 className="mb-3 font-semibold text-emerald-400">✅ Upload Berhasil!</h2>
          <pre className="overflow-auto rounded-lg bg-background p-4 text-xs font-mono text-muted">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-4 flex gap-3">
            <button onClick={() => { setResult(null); setFiles([]); }}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover">
              Upload Lagi
            </button>
            <button onClick={() => router.push("/admin/chapters")}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground">
              Lihat Chapters
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Chapter Main <span className="text-accent">*</span></label>
              <input type="number" min={0} value={chapterMain} onChange={(e) => handleChapterMainChange(e.target.value)}
                placeholder="1" required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Chapter Sub</label>
              <input type="number" min={0} value={chapterSub} onChange={(e) => setChapterSub(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Chapter Label <span className="text-accent">*</span></label>
            <input type="text" value={chapterLabel} onChange={(e) => setChapterLabel(e.target.value)}
              placeholder="Chapter 1" required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Folder Name di GDrive <span className="text-accent">*</span></label>
            <input type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)}
              placeholder="Chapter_001" required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Volume Number</label>
            <input type="number" min={0} value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)}
              placeholder="Opsional"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              File Gambar <span className="text-accent">*</span>
              {files.length > 0 && (
                <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">{files.length} file</span>
              )}
            </label>
            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleFilesChange}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white" />
            <p className="mt-1 text-[11px] text-muted">Format: JPG, PNG, WEBP · Max {10}MB per file · Diurutkan otomatis by nama</p>
            {files.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-border bg-background p-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5 text-xs text-muted">
                    <span className="font-mono">{f.name}</span>
                    <span>{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={preserveFilenames} onChange={(e) => setPreserveFilenames(e.target.checked)}
              className="h-4 w-4 accent-accent" />
            <span className="text-sm text-foreground">Preserve original filenames</span>
          </label>

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
                  Uploading...
                </span>
              ) : "⬆️ Upload Chapter"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}