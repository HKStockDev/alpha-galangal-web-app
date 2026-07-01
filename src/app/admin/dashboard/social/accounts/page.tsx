import { Suspense } from "react";
import { AdminSocialAccountsPanel } from "@/components/social/admin-social-accounts-panel";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";

export default function AdminSocialAccountsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="card" lines={4} className="mx-auto max-w-6xl py-6" />}>
      <AdminSocialAccountsPanel />
    </Suspense>
  );
}
