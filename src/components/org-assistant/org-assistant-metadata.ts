export type OrgChatThreadMetadata = {
  pinned?: boolean;
  archived?: boolean;
};

export function readThreadMetadata(
  metadata: Record<string, unknown> | undefined
): OrgChatThreadMetadata {
  const m = metadata ?? {};
  return {
    pinned: m.pinned === true,
    archived: m.archived === true,
  };
}

export function mergeThreadMetadata(
  current: Record<string, unknown> | undefined,
  patch: OrgChatThreadMetadata
): Record<string, unknown> {
  return { ...(current ?? {}), ...patch };
}
