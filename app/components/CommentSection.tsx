"use client";

// app/components/CommentSection.tsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/lib/auth";
import {
    subscribeToMangaComments,
    subscribeToChapterComments,
    addMangaComment,
    addChapterComment,
    type Comment,
} from "@/app/lib/firebase-comments";
import { MessageSquare, Send, User } from "lucide-react";

interface Props {
    /** "manga_comments" atau "chapter_comments" */
    collectionType: "manga" | "chapter";
    /** manga.slug atau chapter.slug */
    slug: string;
}

function timeAgo(date: Date): string {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString("id-ID");
}

function Avatar({
    avatarUrl,
    username,
}: {
    avatarUrl: string | null;
    username: string;
}) {
    const initial = username[0]?.toUpperCase() ?? "?";
    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                }}
            />
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E50914] to-[#c8000f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initial}
        </div>
    );
}

export default function CommentSection({ collectionType, slug }: Props) {
    const { user, token, isLoggedIn } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Subscribe realtime
    useEffect(() => {
        setLoading(true);
        const unsub =
            collectionType === "manga"
                ? subscribeToMangaComments(slug, (data) => {
                    setComments(data);
                    setLoading(false);
                })
                : subscribeToChapterComments(slug, (data) => {
                    setComments(data);
                    setLoading(false);
                });

        return () => unsub();
    }, [collectionType, slug]);

    const handleSubmit = async () => {
        if (!isLoggedIn || !user || !message.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
            const userData = {
                id: user.id,
                username: user.username,
                avatar_url: (user as unknown as Record<string, unknown>)?.avatar_url as string | null ?? null,
            };
            if (collectionType === "manga") {
                await addMangaComment(slug, userData, message);
            } else {
                await addChapterComment(slug, userData, message);
            }
            setMessage("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";
        } catch {
            setError("Gagal mengirim komentar. Coba lagi.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        // Auto-resize
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    return (
        <div className="mt-10 mx-auto max-w-[800px] w-full px-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-foreground">
                    Diskusi
                    {!loading && (
                        <span className="ml-1.5 text-xs text-muted font-normal">
                            ({comments.length})
                        </span>
                    )}
                </h2>
            </div>

            {/* Input area */}
            <div className="mb-6">
                {isLoggedIn && user ? (
                    <div className="flex gap-3">
                        <Avatar
                            avatarUrl={
                                (user as unknown as Record<string, unknown>)?.avatar_url as string | null ?? null
                            }
                            username={user.username}
                        />
                        <div className="flex-1">
                            <div className="relative rounded-xl border border-border bg-card-bg overflow-hidden focus-within:border-accent/50 transition-colors">
                                <textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={handleTextareaInput}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tulis komentar... (Enter untuk kirim)"
                                    rows={2}
                                    maxLength={1000}
                                    style={{ resize: "none", overflow: "hidden" }}
                                    className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-foreground placeholder:text-muted focus:outline-none"
                                />
                                {/* Bottom bar */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                    <span className="text-[10px] text-muted">
                                        {message.length}/1000
                                    </span>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !message.trim()}
                                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <Send className="w-3 h-3" />
                                        )}
                                        Kirim
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <p className="mt-1.5 text-xs text-red-500">{error}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
                        className="w-full rounded-xl border border-border bg-card-bg py-3.5 text-sm text-muted hover:border-accent/40 hover:text-accent transition-colors flex items-center justify-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        Login untuk ikut berdiskusi
                    </button>
                )}
            </div>

            {/* Comments list */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <svg className="w-5 h-5 animate-spin text-muted" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-sm text-muted">Belum ada komentar. Jadilah yang pertama!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                            <Avatar avatarUrl={c.avatar_url} username={c.username} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-bold text-foreground">
                                        {c.username}
                                    </span>
                                    <span className="text-[10px] text-muted">
                                        {timeAgo(c.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                                    {c.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom spacer */}
            <div className="h-8" />
        </div>
    );
}
