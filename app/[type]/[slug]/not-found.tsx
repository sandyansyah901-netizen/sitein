import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-accent">404</h1>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Komik Tidak Ditemukan
        </h2>
        <p className="mb-6 text-muted">
          Komik yang kamu cari mungkin sudah dihapus atau URL salah.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          ← Kembali ke Home
        </Link>
      </div>
    </main>
  );
}