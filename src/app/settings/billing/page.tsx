import { redirect } from "next/navigation";
import { ORG_DASHBOARD } from "@/lib/auth-routing";

type Props = {
  searchParams: Promise<{ billing?: string }>;
};

/** Stripe Customer Portal return URL → org billing section (preserves ?billing= query). */
export default async function SettingsBillingRedirectPage({ searchParams }: Props) {
  const { billing } = await searchParams;
  const qs =
    billing && ["canceled", "updated", "payment_updated"].includes(billing)
      ? `?billing=${encodeURIComponent(billing)}`
      : "";
  redirect(`${ORG_DASHBOARD}/settings${qs}#billing`);
}
