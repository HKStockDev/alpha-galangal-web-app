/** Capabilities that require confirmation before disabling (CON-160). */
export const CRITICAL_CAPABILITIES = ["chat.global", "chat.client"] as const;

export function isCriticalCapability(capabilityKey: string): boolean {
  return (CRITICAL_CAPABILITIES as readonly string[]).includes(capabilityKey);
}
