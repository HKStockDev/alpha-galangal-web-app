import { Suspense } from "react";
import { AdminSocialOverview } from "@/components/social/admin-social-overview";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";

export default function AdminSocialOverviewPage() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="card" lines={6} className="mx-auto max-w-6xl py-6" />}>
      <AdminSocialOverview />
    </Suspense>
  );
}
