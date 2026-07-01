import dummyReplies from "@/data/assistant/dummy-replies.json";

export function isAssistantDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_ASSISTANT_DEMO_MODE === "true";
}

function pickKeywordReply(text: string): string | null {
  const lower = text.toLowerCase();
  for (const entry of dummyReplies.keywordReplies) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.reply;
    }
  }
  return null;
}

function pickPoolReply(scope: "general" | "client"): string {
  const pool =
    scope === "client" ? dummyReplies.clientReplies : dummyReplies.generalReplies;
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

export function pickDemoAssistantReply(
  userText: string,
  scope: "general" | "client"
): string {
  return pickKeywordReply(userText) ?? pickPoolReply(scope);
}

export function formatToolUsedLabel(toolKey: string): string {
  const stripped = toolKey.replace(/^tool\./, "").replace(/\./g, " ");
  return stripped
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
