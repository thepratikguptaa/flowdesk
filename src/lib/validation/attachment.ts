// Server-side upload constraints. Enforced in the upload action; the client
// input `accept` is only a hint and must never be trusted.

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/** Allowed MIME types → safe display label. */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": "PNG image",
  "image/jpeg": "JPEG image",
  "image/gif": "GIF image",
  "image/webp": "WebP image",
  "application/pdf": "PDF",
  "text/plain": "Text file",
  "application/msword": "Word document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word document",
  "application/vnd.ms-excel": "Excel spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "Excel spreadsheet",
};

export const ACCEPT_ATTR = Object.keys(ALLOWED_MIME_TYPES).join(",");

export function isAllowedMime(mime: string): boolean {
  return mime in ALLOWED_MIME_TYPES;
}

/** Strip any path components a malicious client might send in the filename. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^\w.\- ]+/g, "_").slice(0, 200) || "file";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
