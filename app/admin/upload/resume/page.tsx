"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resumeUpload, fetchUploadProgress } from "@/app/lib/upload-api";

export default function ResumeUploadPage() {
  const router = useRouter();
  const [resumeToken, setResumeToken] = useState("");
  const [progressId, setProgressId] = useState("");
  const [isResuming, setIsResuming] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [progress, setProgress] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const handleResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeToken.trim()) return;
    setError("");
    setResult(null);
    setIsResuming(true);
    try {
      const res = await resumeUpload(resumeToken.trim());
      setResult(res as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resume gagal");
    } finally {
      setIsResuming(false);
    }
  };

  const handleCheckProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressId.trim()) return;
    setError("");
    setProgress(null);
    setIsChecking(true);
    try {
      const res = await fetchUploadProgress(progressId.trim());
      setProgress(res as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal cek progress");
    } finally {
      setIsChecking(false);
    }
  };

  const progressPercent = typeof progress?.progress === "number" ? progress.progress : 0;
  const progressStatus = typeof progress?.status === "string" ? progress.status : "";
  const progressCurrentFile = typeof progress?.current_file === "string" ? progress.current_file : null;
  const progressProcessed = typeof progress?.processed_files === "number" ? progress.processed_files : null;
  const progressTotal = typeof progress?.total_files === "number" ? progress.total_files : null;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="mb-3 flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-foreground">Resume & Progress Upload</h1>
        <p className="mt-1 text-sm text-muted">Cek progress upload atau lanjutkan upload yang terputus</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card-bg p-6">
          <h2 className="mb-1 font-semibold text-foreground">Cek Progress Upload</h2>
          <p className="mb-4 text-xs text-muted">Masukkan upload_id dari response upload</p>
          <form onSubmit={handleCheckProgress} className="flex gap-2">
            <input type="text" value={progressId} onChange={(e) => setProgressId(e.target.value)}
              placeholder="upload_id..." required
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
            <button type="submit" disabled={isChecking}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
              {isChecking ? "..." : "Cek"}
            </button>
          </form>

          {progress && (
            <div className="mt-4 rounded-lg bg-background p-4">
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{progressStatus}</span>
                  <span>{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                {progressCurrentFile && (
                  <p className="mt-1 text-xs font-mono text-muted truncate">{progressCurrentFile}</p>
                )}
                {progressProcessed !== null && progressTotal !== null && (
                  <p className="text-xs text-muted">{progressProcessed} / {progressTotal} files</p>
                )}
              </div>
              <pre className="text-[10px] font-mono text-muted overflow-auto max-h-32">
                {JSON.stringify(progress, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card-bg p-6">
          <h2 className="mb-1 font-semibold text-foreground">Resume Upload</h2>
          <p className="mb-4 text-xs text-muted">Masukkan resume_token dari upload yang gagal</p>
          <form onSubmit={handleResume} className="flex gap-2">
            <input type="text" value={resumeToken} onChange={(e) => setResumeToken(e.target.value)}
              placeholder="resume_token..." required
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
            <button type="submit" disabled={isResuming}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-60">
              {isResuming ? "..." : "Resume"}
            </button>
          </form>

          {result && (
            <div className="mt-4 rounded-lg border border-emerald-800/40 bg-emerald-900/10 p-4">
              <p className="mb-2 text-sm font-semibold text-emerald-400">✅ Resume berhasil</p>
              <pre className="text-[10px] font-mono text-muted overflow-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}