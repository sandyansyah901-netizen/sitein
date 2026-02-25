"use client";

import Link from "next/link";

interface SearchPaginationProps {
    currentPage: number;
    totalPages: number;
    search: string;
}

export default function SearchPagination({
    currentPage,
    totalPages,
    search,
}: SearchPaginationProps) {
    if (totalPages <= 1) return null;

    function buildHref(page: number) {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("page", page.toString());
        return `/search?${params.toString()}`;
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

    const linkBase =
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors border border-border text-foreground hover:border-accent hover:text-accent";
    const activeLink =
        "rounded-lg px-3 py-2 text-sm font-medium bg-[#E50914] text-white";
    const disabledLink =
        "rounded-lg border border-border px-3 py-2 text-sm text-foreground opacity-30 pointer-events-none";

    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Prev */}
            {currentPage <= 1 ? (
                <span className={disabledLink}>← Prev</span>
            ) : (
                <Link href={buildHref(currentPage - 1)} className={linkBase}>
                    ← Prev
                </Link>
            )}

            {/* Pages */}
            {pages.map((page, idx) =>
                page === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-sm text-muted">
                        ...
                    </span>
                ) : (
                    <Link
                        key={page}
                        href={buildHref(page as number)}
                        className={page === currentPage ? activeLink : linkBase}
                    >
                        {page}
                    </Link>
                )
            )}

            {/* Next */}
            {currentPage >= totalPages ? (
                <span className={disabledLink}>Next →</span>
            ) : (
                <Link href={buildHref(currentPage + 1)} className={linkBase}>
                    Next →
                </Link>
            )}
        </div>
    );
}
