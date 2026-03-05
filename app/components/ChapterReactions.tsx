"use client";

// app/components/ChapterReactions.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth";
import {
    subscribeToReactions,
    getUserReaction,
    reactToChapter,
    type ReactionType,
    type ReactionCounts,
} from "@/app/lib/firebase-comments";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
    { type: "upvote", emoji: "👍", label: "Keren" },
    { type: "love", emoji: "❤️", label: "Love" },
    { type: "funny", emoji: "😂", label: "Lucu" },
    { type: "surprised", emoji: "😮", label: "Kaget" },
    { type: "sad", emoji: "😢", label: "Sedih" },
    { type: "angry", emoji: "😤", label: "Marah" },
];

interface Props {
    chapterSlug: string;
}

function formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

export default function ChapterReactions({ chapterSlug }: Props) {
    const { user, isLoggedIn } = useAuth();
    const [counts, setCounts] = useState<ReactionCounts>({
        upvote: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0,
    });
    const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
    const [processing, setProcessing] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);

    // Subscribe to realtime counts
    useEffect(() => {
        const unsub = subscribeToReactions(chapterSlug, setCounts);
        return () => unsub();
    }, [chapterSlug]);

    // Fetch user's existing reaction when logged in
    useEffect(() => {
        if (!isLoggedIn || !user) {
            setUserReaction(null);
            return;
        }
        setLoadingUser(true);
        getUserReaction(chapterSlug, user.id)
            .then(setUserReaction)
            .finally(() => setLoadingUser(false));
    }, [chapterSlug, isLoggedIn, user]);

    const handleReact = async (reaction: ReactionType) => {
        if (!isLoggedIn || !user) {
            window.dispatchEvent(new CustomEvent("open-login-modal"));
            return;
        }
        if (processing) return;

        setProcessing(true);
        try {
            await reactToChapter(chapterSlug, user.id, reaction);
            // Reload user reaction (counts update via subscribe)
            const updated = await getUserReaction(chapterSlug, user.id);
            setUserReaction(updated);
        } catch (e) {
            console.error("React gagal:", e);
        } finally {
            setProcessing(false);
        }
    };

    const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="mx-auto max-w-[800px] w-full px-4 mt-10 mb-6">
            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted uppercase tracking-widest font-semibold">
                    Reaksi
                </span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {/* Subtitle */}
            <p className="text-center text-xs text-muted mb-4">
                {totalReactions > 0
                    ? `${totalReactions} orang bereaksi pada chapter ini`
                    : "Jadilah yang pertama bereaksi!"}
            </p>

            {/* Reaction buttons */}
            <div className="flex items-center justify-center flex-wrap gap-2">
                {REACTIONS.map(({ type, emoji, label }) => {
                    const count = counts[type] ?? 0;
                    const isActive = userReaction === type;

                    return (
                        <button
                            key={type}
                            onClick={() => handleReact(type)}
                            disabled={processing || loadingUser}
                            title={label}
                            className={`
                group flex flex-col items-center gap-1
                rounded-xl border px-3.5 py-2 transition-all duration-200
                disabled:cursor-not-allowed
                ${isActive
                                    ? "border-accent/60 bg-accent/10 shadow-sm shadow-accent/20"
                                    : "border-border bg-card-bg hover:border-accent/40 hover:bg-accent/5"
                                }
              `}
                        >
                            <span
                                className={`text-xl transition-transform duration-200 ${isActive
                                        ? "scale-110"
                                        : "group-hover:scale-110"
                                    }`}
                            >
                                {emoji}
                            </span>
                            <span
                                className={`text-[10px] font-bold tabular-nums ${isActive
                                        ? "text-accent"
                                        : "text-muted group-hover:text-accent"
                                    }`}
                            >
                                {formatCount(count)}
                            </span>
                            <span
                                className={`text-[9px] leading-none ${isActive ? "text-accent/70" : "text-muted/60"
                                    }`}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Login hint (not logged in) */}
            {!isLoggedIn && (
                <p className="text-center text-[10px] text-muted mt-3">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
                        className="underline hover:text-accent transition-colors"
                    >
                        Login
                    </button>
                    {" "}untuk bereaksi
                </p>
            )}
        </div>
    );
}
