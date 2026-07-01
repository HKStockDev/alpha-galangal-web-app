import { Suspense } from "react";
import { ResetPasswordConfirmForm } from "./confirm-form";

function ConfirmFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-input border-t-foreground" />
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<ConfirmFallback />}>
      <ResetPasswordConfirmForm />
    </Suspense>
  );
}
