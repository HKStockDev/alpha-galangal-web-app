import { redirect } from "next/navigation";
import { ADMIN_SOCIAL_ACCOUNTS } from "@/lib/social-routes";

export default function LegacySocialAccountsRedirect() {
  redirect(ADMIN_SOCIAL_ACCOUNTS);
}
