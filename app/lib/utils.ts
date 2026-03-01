/**
 * Normalize slug: spasi & underscore → hyphen, lowercase, hapus karakter spesial.
 * Sesuai docs backend slug normalization.
 */
export function normalizeSlug(slug: string): string {
    return slug
        .replace(/_/g, "-")
        .replace(/ /g, "-")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

const SEO_SUFFIX = "-bahasa-indonesia";

/**
 * Tambahkan suffix "-bahasa-indonesia" ke slug untuk SEO.
 * Contoh: "crimson-reset" → "crimson-reset-bahasa-indonesia"
 */
export function toSeoSlug(slug: string): string {
    if (slug.endsWith(SEO_SUFFIX)) return slug;
    return `${slug}${SEO_SUFFIX}`;
}

/**
 * Strip suffix "-bahasa-indonesia" dari slug URL untuk API call.
 * Contoh: "crimson-reset-bahasa-indonesia" → "crimson-reset"
 */
export function fromSeoSlug(slug: string): string {
    if (slug.endsWith(SEO_SUFFIX)) {
        return slug.slice(0, -SEO_SUFFIX.length);
    }
    return slug;
}

/**
 * Generate manga detail URL: /{type}/{slug}-bahasa-indonesia
 */
export function mangaHref(typeSlug: string | undefined, slug: string): string {
    return `/${typeSlug || "manga"}/${toSeoSlug(slug)}`;
}
