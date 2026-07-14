"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Upload, Download, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { uploadAttachment, deleteAttachment } from "@/lib/actions/attachments";
import { ACCEPT_ATTR, formatBytes } from "@/lib/validation/attachment";
import { Button } from "@/components/ui/button";

export type AttachmentItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedByName: string | null;
  canDelete: boolean;
};

export function AttachmentsPanel({
  caseId,
  attachments,
}: {
  caseId: string;
  attachments: AttachmentItem[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("caseId", caseId);
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadAttachment({}, fd);
      if (res.ok) toast.success("File uploaded");
      else toast.error(res.error ?? "Upload failed");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteAttachment({}, fd);
      if (res.ok) toast.success("Attachment removed");
      else toast.error(res.error ?? "Could not remove");
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {attachments.map((a) => {
            const Icon = a.mimeType.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(a.size)}
                    {a.uploadedByName ? ` · ${a.uploadedByName}` : ""}
                  </p>
                </div>
                <a
                  href={`/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                  aria-label={`Download ${a.filename}`}
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
                {a.canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${a.filename}`}
                    disabled={pending && deletingId === a.id}
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? (
          "Uploading…"
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload file
          </>
        )}
      </Button>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Paperclip className="h-3 w-3" />
        Images, PDF, Word, Excel, or text · up to 10 MB
      </p>
    </div>
  );
}
