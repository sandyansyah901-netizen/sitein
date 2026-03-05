// app/lib/firebase-comments.ts
/**
 * Firebase Firestore — Comments & Reactions
 *
 * Struktur Firestore:
 * manga_comments/{manga_slug}/comments/{comment_id}
 * chapter_comments/{chapter_slug}/comments/{comment_id}
 * chapter_reactions/{chapter_slug}        → counter object
 * chapter_reactions_users/{chapter_slug}/users/{user_id}
 */

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    limit,
    startAfter,
    getDocs,
    type DocumentSnapshot,
    type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ─────────────────────────────────────────────

export interface Comment {
    id: string;
    user_id: number;
    username: string;
    avatar_url: string | null;
    message: string;
    created_at: Date;
}

export type ReactionType = "upvote" | "funny" | "love" | "surprised" | "angry" | "sad";

export interface ReactionCounts {
    upvote: number;
    funny: number;
    love: number;
    surprised: number;
    angry: number;
    sad: number;
}

const DEFAULT_REACTIONS: ReactionCounts = {
    upvote: 0,
    funny: 0,
    love: 0,
    surprised: 0,
    angry: 0,
    sad: 0,
};

// ─── Manga Comments ─────────────────────────────────────

/**
 * Subscribe ke komentar manga secara real-time.
 * Returns unsubscribe function.
 */
export function subscribeToMangaComments(
    mangaSlug: string,
    callback: (comments: Comment[]) => void
): Unsubscribe {
    const q = query(
        collection(db, "manga_comments", mangaSlug, "comments"),
        orderBy("created_at", "desc"),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const comments: Comment[] = snapshot.docs.map((d) => ({
            id: d.id,
            user_id: d.data().user_id,
            username: d.data().username,
            avatar_url: d.data().avatar_url ?? null,
            message: d.data().message,
            created_at: d.data().created_at?.toDate?.() ?? new Date(),
        }));
        callback(comments);
    });
}

/**
 * Tambah komentar manga.
 */
export async function addMangaComment(
    mangaSlug: string,
    user: { id: number; username: string; avatar_url?: string | null },
    message: string
): Promise<void> {
    await addDoc(collection(db, "manga_comments", mangaSlug, "comments"), {
        user_id: user.id,
        username: user.username,
        avatar_url: user.avatar_url ?? null,
        message: message.trim(),
        created_at: serverTimestamp(),
    });
}

// ─── Chapter Comments ────────────────────────────────────

/**
 * Subscribe ke komentar chapter secara real-time.
 */
export function subscribeToChapterComments(
    chapterSlug: string,
    callback: (comments: Comment[]) => void
): Unsubscribe {
    const q = query(
        collection(db, "chapter_comments", chapterSlug, "comments"),
        orderBy("created_at", "desc"),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const comments: Comment[] = snapshot.docs.map((d) => ({
            id: d.id,
            user_id: d.data().user_id,
            username: d.data().username,
            avatar_url: d.data().avatar_url ?? null,
            message: d.data().message,
            created_at: d.data().created_at?.toDate?.() ?? new Date(),
        }));
        callback(comments);
    });
}

/**
 * Tambah komentar chapter.
 */
export async function addChapterComment(
    chapterSlug: string,
    user: { id: number; username: string; avatar_url?: string | null },
    message: string
): Promise<void> {
    await addDoc(collection(db, "chapter_comments", chapterSlug, "comments"), {
        user_id: user.id,
        username: user.username,
        avatar_url: user.avatar_url ?? null,
        message: message.trim(),
        created_at: serverTimestamp(),
    });
}

// ─── Chapter Reactions ────────────────────────────────────

/**
 * Subscribe ke reaction counts chapter secara real-time.
 */
export function subscribeToReactions(
    chapterSlug: string,
    callback: (counts: ReactionCounts) => void
): Unsubscribe {
    const ref = doc(db, "chapter_reactions", chapterSlug);
    return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
            callback({ ...DEFAULT_REACTIONS, ...(snap.data() as ReactionCounts) });
        } else {
            callback({ ...DEFAULT_REACTIONS });
        }
    });
}

/**
 * Ambil reaction user yang sudah dipilih sebelumnya.
 * Returns null jika belum pernah react.
 */
export async function getUserReaction(
    chapterSlug: string,
    userId: number
): Promise<ReactionType | null> {
    const ref = doc(db, "chapter_reactions_users", chapterSlug, "users", String(userId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return (snap.data().reaction as ReactionType) ?? null;
}

/**
 * React ke chapter. Mencegah double-react.
 * Jika user sudah react dengan reaksi yang sama → tidak berubah (idempotent).
 * Jika user sudah react dengan reaksi lain → ganti (decrement lama, increment baru).
 */
export async function reactToChapter(
    chapterSlug: string,
    userId: number,
    newReaction: ReactionType
): Promise<void> {
    const userRef = doc(db, "chapter_reactions_users", chapterSlug, "users", String(userId));
    const reactionsRef = doc(db, "chapter_reactions", chapterSlug);

    // Cek reaksi lama
    const userSnap = await getDoc(userRef);
    const oldReaction: ReactionType | null = userSnap.exists()
        ? (userSnap.data().reaction as ReactionType)
        : null;

    // Jika sama persis → ignore (sudah react dengan emoji yang sama)
    if (oldReaction === newReaction) return;

    // Build update object untuk counter
    const counterUpdate: Record<string, ReturnType<typeof increment>> = {
        [newReaction]: increment(1),
    };

    // Kalau ada reaksi lama → decrement
    if (oldReaction) {
        counterUpdate[oldReaction] = increment(-1);
    }

    // Update counter (buat dok baru jika belum ada)
    const counterSnap = await getDoc(reactionsRef);
    if (!counterSnap.exists()) {
        // Init dengan semua 0, lalu set reaksi baru ke 1
        await setDoc(reactionsRef, { ...DEFAULT_REACTIONS, [newReaction]: 1 });
    } else {
        await updateDoc(reactionsRef, counterUpdate);
    }

    // Simpan/update reaksi user
    await setDoc(userRef, {
        reaction: newReaction,
        created_at: serverTimestamp(),
    });
}
