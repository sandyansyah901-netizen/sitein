"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
    totalPages: number;
    currentPage: number;
    paramName?: string; // default: "update_page"
    basePath?: string;  // default: "/"
}

export default function JumpToPage({ totalPages, currentPage, paramName = "update_page", basePath = "/" }: Props) {
    const router = useRouter();
    const [val, setVal] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const p = parseInt(val, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
            router.push(`${basePath}?${paramName}=${p}`);
            setVal("");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-500">
                Hal. {currentPage}/{totalPages}. Ke:
            </span>
            <input
                type="number"
                min={1}
                max={totalPages}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={`1–${totalPages}`}
                className="w-16 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-transparent px-2 py-1 text-[11px] text-center text-gray-700 dark:text-gray-300 outline-none focus:border-[#E50914] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
                type="submit"
                className="rounded-lg bg-[#E50914] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#c0070f] transition-colors"
            >
                Go
            </button>
        </form>
    );
}
