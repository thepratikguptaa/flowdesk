// Azure OpenAI integration for the optional case-summary feature.
//
// We call the deployment's chat/completions endpoint directly (the full URL is
// provided via AZURE_OPENAI_ENDPOINT). This avoids SDK/URL-shape mismatches and
// uses the exact endpoint the resource exposes. AI is never required for the
// core workflow — every code path degrades gracefully when it's unconfigured.

export function isAIConfigured(): boolean {
  return Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatComplete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !apiKey) throw new Error("Azure OpenAI is not configured.");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 400,
    }),
    // Don't let a slow model hang a server action indefinitely.
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Azure OpenAI ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Azure OpenAI returned an empty completion.");
  return content;
}
