"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateJsonConfig } from "@/app/lib/upload-api";

const JSON_EXAMPLE = JSON.stringify({
  manga_slug: "one-piece",
  chapters: [
    { chapter_main: 1, chapter_sub: 0, chapter_label: "Chapter 1", chapter_folder_name: "Chapter_01" },
  ],
}, null, 2);

export default function ValidateJsonPage() {
  const router = useRouter();
  const [config, setConfig] = useState(JSON_EXAMPLE);
  const [checkExisting, setCheckExisting] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsValidating(true);
    try {
      const res = await validateJsonConfig({ config, check_existing: checkExisting });
      setResult(res as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validasi gagal");
    } finally {
      setIsValidating(false);
    }
  };

  const isValid = result && !result.errors && !(result.has_errors);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-foreground">Validate JSON Config</h1>
        <p className="mt-1 text-sm text-muted">Validasi JSON config sebelum upload tanpa melakukan perubahan apapun</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">⚠️ {error}</div>}

      {result && (
        <div className={`mb-4 rounded-xl border p-5 ${isValid ? "border-emerald-800/40 bg-emerald-900/10" : "border-yellow-800/40 bg-yellow-900/10"}`}>
          <h3 className={`mb-2 font-semibold ${isValid ? "text-emerald-400" : "text-yellow-400"}`}>
            {isValid ? "✅ JSON Valid!" : "⚠️ Ada Warning / Error"}
          </h3>
          <pre className="overflow-auto text-xs font-mono text-muted max-h-64">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleValidate} className="space-y-5 rounded-xl border border-border bg-card-bg p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">JSON Config <span className="text-accent">*</span></label>
          <textarea value={config} onChange={(e) => setConfig(e.target.value)} rows={14} required
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-mono text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-y" />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={checkExisting} onChange={(e) => setCheckExisting(e.target.checked)} className="h-4 w-4 accent-accent" />
          <div>
            <span className="text-sm text-foreground">Check Existing Data</span>
            <p className="text-xs text-muted">Cek konflik dengan data yang sudah ada di database</p>
          </div>
        </label>

        <div className="flex justify-end border-t border-border pt-4">
          <button type="submit" disabled={isValidating}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
            {isValidating ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Validating...
              </span>
            ) : "✅ Validate JSON"}
          </button>
        </div>
      </form>
    </div>
  );
}