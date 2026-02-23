"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/?${params.toString()}`);
  }

  const pages: (number | string)[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        ← Prev
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-sm text-muted">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page as number)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-accent text-white"
                : "border border-border text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}