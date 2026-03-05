"use client";

import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/app/lib/auth";
import {
    uploadAvatar, updateAvatarUrl, deleteAvatar,
    updateName, changePassword,
} from "@/app/lib/user-api";
import { Camera, Link2, Trash2, CheckCircle2, AlertCircle, User, Lock, Pen } from "lucide-react";

type Tab = "upload" | "url" | "name" | "password";

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
    return (
        <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${type === "success"
            ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
            : "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            }`}>
            {type === "success" ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{msg}</span>
        </div>
    );
}

function Spinner() {
    return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

export default function ProfilePage() {
    const { user, token, isLoggedIn, isLoading, refreshUser } = useAuth();
    const [tab, setTab] = useState<Tab>("upload");

    // Avatar states
    const [urlInput, setUrlInput] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Name states
    const [nameInput, setNameInput] = useState("");
    const [isSavingName, setIsSavingName] = useState(false);

    // Password states
    const [pwCurrent, setPwCurrent] = useState("");
    const [pwNew, setPwNew] = useState("");
    const [pwConfirm, setPwConfirm] = useState("");
    const [isChangingPw, setIsChangingPw] = useState(false);

    // Common
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const avatarUrl: string | null = (user as unknown as Record<string, unknown>)?.avatar_url as string | null ?? null;
    const currentName: string | null = (user as unknown as Record<string, unknown>)?.name as string | null ?? null;
    const displayName = currentName || user?.username || "User";
    const initial = displayName[0]?.toUpperCase() ?? "?";

    // Pre-fill name input when user data loads
    useEffect(() => {
        if (currentName) setNameInput(currentName);
    }, [currentName]);

    const clearMsg = () => setMsg(null);
    const switchTab = (t: Tab) => { setTab(t); clearMsg(); };

    // ── Avatar handlers ──────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        clearMsg();
    };

    const handleUploadFile = async () => {
        if (!token || !selectedFile) return;
        setIsUploading(true); clearMsg();
        try {
            const result = await uploadAvatar(token, selectedFile);
            setMsg({ type: "success", text: result.message });
            setSelectedFile(null); setPreview(null);
            if (fileRef.current) fileRef.current.value = "";
            refreshUser?.();
        } catch (e) {
            setMsg({ type: "error", text: e instanceof Error ? e.message : "Upload gagal" });
        } finally { setIsUploading(false); }
    };

    const handleUploadUrl = async () => {
        if (!token || !urlInput.trim()) return;
        setIsUploading(true); clearMsg();
        try {
            const result = await updateAvatarUrl(token, urlInput.trim());
            setMsg({ type: "success", text: result.message });
            setUrlInput(""); refreshUser?.();
        } catch (e) {
            setMsg({ type: "error", text: e instanceof Error ? e.message : "Gagal update URL" });
        } finally { setIsUploading(false); }
    };

    const handleDelete = async () => {
        if (!token || !confirm("Hapus foto profil?")) return;
        setIsDeleting(true); clearMsg();
        try {
            const result = await deleteAvatar(token);
            setMsg({ type: "success", text: result.message }); refreshUser?.();
        } catch (e) {
            setMsg({ type: "error", text: e instanceof Error ? e.message : "Gagal hapus avatar" });
        } finally { setIsDeleting(false); }
    };

    // ── Name handler ─────────────────────────────────────────────────────

    const handleSaveName = async () => {
        if (!token || !nameInput.trim()) return;
        setIsSavingName(true); clearMsg();
        try {
            const result = await updateName(token, nameInput.trim());
            setMsg({ type: "success", text: result.message }); refreshUser?.();
        } catch (e) {
            setMsg({ type: "error", text: e instanceof Error ? e.message : "Gagal menyimpan nama" });
        } finally { setIsSavingName(false); }
    };

    // ── Password handler ─────────────────────────────────────────────────

    const handleChangePassword = async () => {
        if (!token) return;
        if (!pwCurrent || !pwNew || !pwConfirm) {
            setMsg({ type: "error", text: "Semua field wajib diisi" }); return;
        }
        if (pwNew !== pwConfirm) {
            setMsg({ type: "error", text: "Konfirmasi password tidak cocok" }); return;
        }
        if (pwNew.length < 6) {
            setMsg({ type: "error", text: "Password baru minimal 6 karakter" }); return;
        }
        setIsChangingPw(true); clearMsg();
        try {
            const result = await changePassword(token, pwCurrent, pwNew);
            setMsg({ type: "success", text: result.message });
            setPwCurrent(""); setPwNew(""); setPwConfirm("");
        } catch (e) {
            setMsg({ type: "error", text: e instanceof Error ? e.message : "Gagal ganti password" });
        } finally { setIsChangingPw(false); }
    };

    // ── Render ───────────────────────────────────────────────────────────

    if (isLoading) return <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Memuat...</div>;

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <div className="text-5xl">🔐</div>
                <h2 className="text-lg font-bold text-[#222] dark:text-white">Kamu belum login</h2>
                <p className="text-sm text-gray-500">Login dulu untuk mengelola profil kamu.</p>
                <button
                    onClick={() => document.getElementById("login-btn")?.click()}
                    className="mt-2 rounded-lg bg-[#E50914] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c8000f]"
                >
                    Login Sekarang
                </button>
            </div>
        );
    }

    const currentAvatar = preview ?? avatarUrl;

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "upload", label: "Upload File", icon: <Camera className="w-4 h-4" /> },
        { key: "url", label: "Dari URL", icon: <Link2 className="w-4 h-4" /> },
        { key: "name", label: "Nama", icon: <Pen className="w-4 h-4" /> },
        { key: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6 max-w-lg">
            <div>
                <h1 className="text-xl font-bold text-[#222] dark:text-white">Pengaturan Profil</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola profil kamu</p>
            </div>

            {/* ── Avatar Preview ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-5 rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] p-5">
                <div className="relative shrink-0">
                    {currentAvatar ? (
                        <img
                            src={currentAvatar} alt="Avatar"
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-[#E50914]/20"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E50914] to-[#c8000f] flex items-center justify-center text-white text-3xl font-black select-none">
                            {initial}
                        </div>
                    )}
                    {preview && <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Preview</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#222] dark:text-white text-[15px]">{displayName}</p>
                    {currentName && <p className="text-xs text-gray-400 dark:text-gray-500">@{user?.username}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    {!avatarUrl && <p className="text-[11px] text-gray-400 mt-1">Belum ada foto profil</p>}
                </div>
                {avatarUrl && (
                    <button
                        onClick={handleDelete} disabled={isDeleting}
                        title="Hapus foto profil"
                        className="ml-auto shrink-0 rounded-lg border border-red-200 dark:border-red-800/40 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                    >
                        {isDeleting ? <Spinner /> : <Trash2 className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* ── Alert ──────────────────────────────────────────────────────── */}
            {msg && <Alert type={msg.type} msg={msg.text} />}

            {/* ── Tabs ───────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#111] overflow-hidden">
                {/* Tab header */}
                <div className="flex overflow-x-auto border-b border-gray-100 dark:border-[#1e1e1e]">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => switchTab(t.key)}
                            className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === t.key
                                ? "text-[#E50914] border-b-2 border-[#E50914] bg-[#E50914]/5"
                                : "text-gray-500 dark:text-gray-400 hover:text-[#222] dark:hover:text-white"
                                }`}
                        >
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Upload File */}
                {tab === "upload" && (
                    <div className="p-5 space-y-4">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Format: JPG, PNG, WEBP, GIF · Maks. 10 MB</p>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] hover:border-[#E50914]/50 hover:bg-[#E50914]/3 transition-colors cursor-pointer p-8 group"
                        >
                            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="sr-only" />
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#E50914]/10 transition-colors">
                                <Camera className="w-6 h-6 text-gray-400 group-hover:text-[#E50914]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-[#222] dark:text-white">{selectedFile ? selectedFile.name : "Klik untuk pilih gambar"}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "atau drag & drop di sini"}</p>
                            </div>
                        </div>
                        <button onClick={handleUploadFile} disabled={!selectedFile || isUploading}
                            className="w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white hover:bg-[#c8000f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {isUploading ? <><Spinner />Mengupload...</> : <><Camera className="w-4 h-4" />Upload Foto</>}
                        </button>
                    </div>
                )}

                {/* Tab: URL */}
                {tab === "url" && (
                    <div className="p-5 space-y-4">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Masukkan URL gambar eksternal (harus https://)</p>
                        <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUploadUrl()}
                                placeholder="https://example.com/foto-saya.jpg"
                                className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] pl-9 pr-4 py-2.5 text-sm text-[#222] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#E50914]/50" />
                        </div>
                        {urlInput && (
                            <div className="rounded-lg border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
                                <p className="px-2 py-1 text-[10px] text-gray-400 border-b border-gray-100 dark:border-[#2a2a2a]">Preview URL</p>
                                <img src={urlInput} alt="Preview" className="w-full h-40 object-contain bg-gray-50 dark:bg-[#1a1a1a]" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                            </div>
                        )}
                        <button onClick={handleUploadUrl} disabled={!urlInput.trim() || isUploading}
                            className="w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white hover:bg-[#c8000f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {isUploading ? <><Spinner />Menyimpan...</> : <><Link2 className="w-4 h-4" />Simpan URL</>}
                        </button>
                    </div>
                )}

                {/* Tab: Nama */}
                {tab === "name" && (
                    <div className="p-5 space-y-4">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Nama tampilan akan muncul di profil. Berbeda dari username yang digunakan saat login.
                        </p>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                                Nama Tampilan
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                    maxLength={100}
                                    placeholder={`Nama tampilan (sekarang: ${currentName || "belum diatur"})`}
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] pl-9 pr-4 py-2.5 text-sm text-[#222] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#E50914]/50"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-right">{nameInput.length}/100</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs text-gray-500">
                            <span className="font-semibold">Username:</span> {user?.username} <span className="text-gray-400">(tidak bisa diubah)</span>
                        </div>
                        <button onClick={handleSaveName} disabled={!nameInput.trim() || isSavingName}
                            className="w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white hover:bg-[#c8000f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {isSavingName ? <><Spinner />Menyimpan...</> : <><Pen className="w-4 h-4" />Simpan Nama</>}
                        </button>
                    </div>
                )}

                {/* Tab: Password */}
                {tab === "password" && (
                    <div className="p-5 space-y-4">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Masukkan password saat ini untuk verifikasi, lalu masukkan password baru.
                        </p>
                        {[
                            { label: "Password Saat Ini", val: pwCurrent, set: setPwCurrent, ph: "••••••••" },
                            { label: "Password Baru", val: pwNew, set: setPwNew, ph: "Min. 6 karakter" },
                            { label: "Konfirmasi Password Baru", val: pwConfirm, set: setPwConfirm, ph: "Ulangi password baru" },
                        ].map((field) => (
                            <div key={field.label}>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{field.label}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={field.val}
                                        onChange={(e) => { field.set(e.target.value); clearMsg(); }}
                                        placeholder={field.ph}
                                        className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] pl-9 pr-4 py-2.5 text-sm text-[#222] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#E50914]/50"
                                    />
                                </div>
                                {field.label === "Konfirmasi Password Baru" && pwNew && pwConfirm && pwNew !== pwConfirm && (
                                    <p className="text-[11px] text-red-500 mt-1">Password tidak cocok</p>
                                )}
                            </div>
                        ))}
                        <button onClick={handleChangePassword} disabled={isChangingPw || !pwCurrent || !pwNew || !pwConfirm}
                            className="w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white hover:bg-[#c8000f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {isChangingPw ? <><Spinner />Menyimpan...</> : <><Lock className="w-4 h-4" />Ganti Password</>}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Info ─────────────────────────────────────────────────────────── */}
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 px-4 py-3">
                <p className="text-[11px] text-blue-600 dark:text-blue-400 space-y-1">
                    <span className="block font-semibold mb-1">ℹ️ Info Profil</span>
                    <span className="block">• Nama tampilan bisa berbeda dari username login kamu</span>
                    <span className="block">• Foto profil diupload ke imgurl.org</span>
                    <span className="block">• Ganti password memerlukan konfirmasi password lama</span>
                </p>
            </div>
        </div>
    );
}
