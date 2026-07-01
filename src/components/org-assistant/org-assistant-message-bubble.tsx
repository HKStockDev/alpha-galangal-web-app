"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatToolUsedLabel } from "./org-assistant-demo";
import type { OrgChatMessage } from "./org-chat-assistant-provider";

type Props = {
  message: OrgChatMessage;
  showTimestamp?: boolean;
  className?: string;
};

export function OrgAssistantMessageBubble({
  message,
  showTimestamp = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl border px-3 py-2 text-sm",
        message.role === "user"
          ? "ml-auto border-primary/30 bg-primary/15 text-foreground"
          : "mr-auto border-border/80 bg-card text-foreground",
        className
      )}
    >
      <p className="whitespace-pre-wrap">{message.content}</p>
      {message.toolsUsed && message.toolsUsed.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {message.toolsUsed.map((tool) => (
            <Badge key={tool} variant="outline" className="rounded-sm text-[10px] font-normal">
              {formatToolUsedLabel(tool)}
            </Badge>
          ))}
        </div>
      ) : null}
      {showTimestamp ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  );
}
