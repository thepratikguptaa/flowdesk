"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

import { summarizeCase } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";

export function CaseSummary({ caseId }: { caseId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await summarizeCase(caseId);
      if (res.summary) setSummary(res.summary);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="space-y-3">
      {summary ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{summary}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Generate a concise, AI-written summary of this case’s history.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button variant="outline" size="sm" onClick={generate} disabled={pending}>
        {pending ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Summarizing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {summary ? "Regenerate summary" : "Generate summary"}
          </>
        )}
      </Button>
    </div>
  );
}
