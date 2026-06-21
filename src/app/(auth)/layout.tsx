import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | NoteSage",
  description: "Login or create an account to access NoteSage.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-muted/40 p-4">
      {children}
    </div>
  );
}
