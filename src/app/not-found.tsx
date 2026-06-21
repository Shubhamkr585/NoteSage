import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background/50 p-4">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <FileQuestion className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find the page you were looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
          </p>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button className="w-full">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
