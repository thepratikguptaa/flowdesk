"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { addComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type CommentItem = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: Date;
};

function initials(name: string | null) {
  const parts = (name ?? "?").trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : (name ?? "?").slice(0, 2)).toUpperCase();
}

function when(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function CommentSection({
  caseId,
  comments,
}: {
  caseId: string;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addComment(caseId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not post comment");
      }
    });
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] font-medium">
                  {initials(c.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.authorName ?? "User"}</span>
                  <span className="text-xs text-muted-foreground">{when(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t pt-4">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={3}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</span>
          <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
            {pending ? "Posting…" : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
