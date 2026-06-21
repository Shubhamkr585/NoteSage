import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
          Welcome to <span className="text-primary">NoteSage</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          The AI-powered learning workspace that transforms static study materials into an interactive learning experience.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/login">
            <Button size="lg" className="rounded-full px-8">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="rounded-full px-8">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
