import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewCase } from "@/lib/auth/rbac";

// Only raster image types are safe to render inline. Notably this EXCLUDES
// image/svg+xml, which can carry <script>/onload and would execute in the
// document's origin if shown inline. Everything else is forced to download.
const INLINE_SAFE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/**
 * Secure attachment download.
 *  - Requires an authenticated user who can view the parent case.
 *  - Only raster images are served inline; SVG/PDF/documents are downloaded.
 *  - `nosniff` blocks MIME sniffing; a locked-down CSP + sandbox neutralizes any
 *    active content (e.g. scripted SVG) even if a browser tries to render it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { case: true, blob: true },
  });

  if (!attachment || !attachment.blob) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!canViewCase(user, attachment.case)) {
    // Don't reveal existence to unauthorized users.
    return new NextResponse("Not found", { status: 404 });
  }

  const inline = INLINE_SAFE_TYPES.has(attachment.mimeType);
  const encodedName = encodeURIComponent(attachment.filename);
  const body = new Uint8Array(attachment.blob.data);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "X-Content-Type-Options": "nosniff",
      // Neutralize any active content in the served file (scripted SVG, etc.).
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
