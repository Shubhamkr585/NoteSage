"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry here in production
    console.error("Global App Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background/50 p-4">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground">
            We apologize, but an unexpected error has occurred. Our servers logged the issue and we will look into it.
          </p>
          {error.message && (
            <div className="mt-4 rounded-md bg-muted/50 p-4 border text-sm text-muted-foreground break-all text-left">
              <code className="text-xs font-mono">{error.message}</code>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Button
            onClick={() => reset()}
            className="w-full flex-1"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="w-full flex-1"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
