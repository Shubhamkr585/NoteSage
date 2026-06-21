// app/layout.tsx
import "./globals.css";
import { Geist, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let theme = "dark";
  let accentColor = "#d0bcff";
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true, accentColor: true },
    });
    theme = user?.theme || "dark";
    accentColor = user?.accentColor || (theme === "light" ? "#6d3bd7" : "#d0bcff");
  } else {
    accentColor = theme === "light" ? "#6d3bd7" : "#d0bcff";
  }

  return (
    <html lang="en" className={cn(theme, geist.variable, inter.variable)} style={{ "--primary": accentColor, "--ring": accentColor } as React.CSSProperties}>
      <body className="bg-background text-on-background font-body-md min-h-screen overflow-x-hidden selection:bg-primary/30">
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
