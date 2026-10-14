/**
 * Only allow redirecting to a same-site relative path. Rejects absolute
 * URLs and protocol-relative URLs (e.g. "https://evil.com", "//evil.com")
 * to prevent an open-redirect via the "next" query param on auth routes.
 */
export function sanitizeRedirectPath(path: string | null): string {
  if (!path) return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
