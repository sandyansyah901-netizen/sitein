"use client";

import { useState } from "react";

interface ChapterImageProps {
  imageUrl: string;
  pageOrder: number;
  totalPages: number;
  isAnchor: boolean;
  onLoadComplete?: () => void;
}

export default function ChapterImage({
  imageUrl,
  pageOrder,
  totalPages,
  isAnchor,
  onLoadComplete,
}: ChapterImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadStart] = useState(Date.now());
  const [loadComplete, setLoadComplete] = useState<number>(0);

  const handleLoadSuccess = () => {
    const completeTime = Date.now();
    setLoadComplete(completeTime);
    setIsLoaded(true);

    const loadTime = completeTime - loadStart;

    console.log(`✅ [${pageOrder}/${totalPages}] ✨ LOADED in ${loadTime}ms`);
    
    if (onLoadComplete) {
      onLoadComplete();
    }
  };

  const handleLoadError = () => {
    const errorTime = Date.now();
    const totalTime = errorTime - loadStart;

    setHasError(true);

    console.error(`❌ [${pageOrder}/${totalPages}] 💥 FAILED after ${totalTime}ms`);
    console.error(`   🔗 URL: ${imageUrl}`);
    
    if (onLoadComplete) {
      onLoadComplete();
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    console.log(`🔄 [${pageOrder}/${totalPages}] Retrying...`);
  };

  return (
    <div className="relative bg-card-bg min-h-[500px]">
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card-bg">
          <div className="relative mb-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-accent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-accent">{pageOrder}</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-foreground">
            📥 Memuat Halaman {pageOrder}
          </p>

          <div className="mt-3 w-32 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent animate-pulse"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}

      {/* Image - Load immediately, no queue */}
      <img
        src={imageUrl}
        alt={`Page ${pageOrder}`}
        className={`relative w-full transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="eager"
        decoding="async"
        onLoad={handleLoadSuccess}
        onError={handleLoadError}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card-bg border border-red-900/20">
          <svg
            className="mb-3 h-14 w-14 text-red-500/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="mb-1 text-sm font-semibold text-foreground">
            💥 Gagal Memuat Halaman {pageOrder}
          </p>
          <p className="mb-2 text-xs text-muted">Coba periksa koneksi internet</p>
          <p className="mb-4 text-[10px] text-red-400/70 max-w-xs truncate px-4">
            {imageUrl}
          </p>
          <button
            onClick={handleRetry}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            🔄 Coba Lagi
          </button>
        </div>
      )}

      {/* Page info overlay */}
      {isLoaded && (
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
          <div className="rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm font-bold text-white">{pageOrder}</span>
            <span className="text-xs text-white/60"> / {totalPages}</span>
          </div>

          {loadComplete > 0 && (
            <div className="rounded bg-black/60 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm font-mono">
              ⏱️ {((loadComplete - loadStart) / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {/* Anchor badge */}
      {isAnchor && isLoaded && (
        <div className="absolute top-2 left-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
          ⚓ Anchor
        </div>
      )}
    </div>
  );
}