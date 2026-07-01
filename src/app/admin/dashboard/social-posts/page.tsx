import { redirect } from "next/navigation";
import { ADMIN_SOCIAL_POSTS } from "@/lib/social-routes";

export default function LegacySocialPostsRedirect() {
  redirect(ADMIN_SOCIAL_POSTS);
}
