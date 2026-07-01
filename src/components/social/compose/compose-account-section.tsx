"use client";

import Image from "next/image";
import Link from "next/link";
import { socialPlatformLabel, type SocialAccountRow } from "@/lib/api";
import { ADMIN_SOCIAL_ACCOUNTS } from "@/lib/social-routes";
import { SectionCard } from "@/components/ui-kit/cards";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ComposeAccountSectionProps = {
  accounts: SocialAccountRow[];
  accountId: string;
  onSelect: (id: string) => void;
};

export function ComposeAccountSection({
  accounts,
  accountId,
  onSelect,
}: ComposeAccountSectionProps) {
  if (!accounts.length) {
    return (
      <SectionCard>
        <h3 className="text-base font-semibold text-foreground">Target account</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No active accounts.{" "}
          <Link href={ADMIN_SOCIAL_ACCOUNTS} className="text-primary underline">
            Connect an account
          </Link>
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-foreground">Target account</h3>
      <p className="mt-1 text-sm text-muted-foreground">Choose where this post will be delivered.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {accounts.map((account) => {
          const imageUrl =
            (account.metadata?.image_url as string | undefined) ??
            (account.metadata?.woop as { image_url?: string } | undefined)?.image_url;
          const isWoop = Boolean(account.metadata?.woop);
          const selected = account.id === accountId;

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(account.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {imageUrl ? (
                  <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs font-medium uppercase">
                    {account.platform.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {account.account_label ?? account.external_account_name ?? account.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {socialPlatformLabel(account.platform)}
                </p>
              </div>
              {isWoop ? <Badge variant="secondary">Woop</Badge> : null}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
