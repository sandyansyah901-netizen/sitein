"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("search", query);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/?${params.toString()}`);
    },
    [query, searchParams, router]
  );

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari manga, manhwa, manhua..."
        className="w-full rounded-lg border border-border bg-card-bg px-4 py-3 pl-11 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
      <svg
        className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Cari
      </button>
    </form>
  );
}