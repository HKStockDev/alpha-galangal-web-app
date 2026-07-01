"use client";

import { useCallback, useState } from "react";
import type { ActionConfirmRequest } from "@/components/ui-kit/action-confirm-dialog";

export function useActionConfirm() {
  const [request, setRequest] = useState<ActionConfirmRequest | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const requestConfirm = useCallback((next: ActionConfirmRequest) => {
    setRequest(next);
  }, []);

  const dismissConfirm = useCallback(() => {
    if (!isConfirming) setRequest(null);
  }, [isConfirming]);

  const handleConfirm = useCallback(async () => {
    if (!request) return;
    setIsConfirming(true);
    try {
      await request.onConfirm();
      setRequest(null);
    } finally {
      setIsConfirming(false);
    }
  }, [request]);

  return {
    request,
    isConfirming,
    requestConfirm,
    dismissConfirm,
    handleConfirm,
  };
}
