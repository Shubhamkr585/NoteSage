"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DocumentPollerProps {
  hasProcessing: boolean;
}

export function DocumentPoller({ hasProcessing }: DocumentPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!hasProcessing) return;

    console.log("[DocumentPoller] Processing documents detected. Starting polling...");
    const interval = setInterval(() => {
      router.refresh();
    }, 2500);

    return () => {
      console.log("[DocumentPoller] Stopping polling...");
      clearInterval(interval);
    };
  }, [hasProcessing, router]);

  return null;
}
