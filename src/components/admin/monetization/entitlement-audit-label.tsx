import { formatAdminDateTime } from "@/components/admin/monetization/format-datetime";
import type { EntitlementCell } from "@/lib/api";

export function EntitlementAuditLabel({
  cell,
  currentUserId,
  currentUserLabel,
}: {
  cell: EntitlementCell;
  currentUserId?: string | null;
  currentUserLabel?: string | null;
}) {
  if (!cell.updated_at && !cell.updated_by_user_id) {
    return null;
  }

  const isSelf = currentUserId && cell.updated_by_user_id === currentUserId;
  const editorLabel = isSelf
    ? (currentUserLabel?.trim() || "You")
    : cell.updated_by_user_id
      ? cell.updated_by_user_id.slice(0, 8) + "…"
      : null;

  return (
    <p className="text-xs text-muted-foreground">
      {cell.updated_at && (
        <>
          Last updated {formatAdminDateTime(cell.updated_at)}
          {editorLabel ? " · " : ""}
        </>
      )}
      {editorLabel && (
        <>
          {isSelf ? "Edited by " : "Editor "}
          <span
            className={isSelf ? "font-medium text-foreground" : "font-mono"}
            title={cell.updated_by_user_id ?? undefined}
          >
            {editorLabel}
          </span>
        </>
      )}
    </p>
  );
}
