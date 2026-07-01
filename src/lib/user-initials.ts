/** Two-letter initials for avatar fallbacks (matches dashboard header logic). */
export function userInitials(fullName: string | null, email: string): string {
  const trimmed = (fullName ?? "").trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (
        (parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")
      ).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase() || "?";
}
