import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewCase } from "@/lib/auth/rbac";

/**
 * Secure attachment download.
 *  - Requires an authenticated user who can view the parent case.
 *  - Images are served inline; everything else is forced to download.
 *  - `X-Content-Type-Options: nosniff` prevents MIME sniffing / drive-by XSS.
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

  const isImage = attachment.mimeType.startsWith("image/");
  const encodedName = encodeURIComponent(attachment.filename);
  const body = new Uint8Array(attachment.blob.data);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${isImage ? "inline" : "attachment"}; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
