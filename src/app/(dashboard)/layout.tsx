import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Sidebar />
      <Topbar />
      
      {/* Main Content Area matches the Stitch padding */}
      <main className="pt-24 pb-12 px-4 md:pl-[320px] md:pr-margin-desktop animate-in fade-in duration-500 min-h-screen">
        {children}
      </main>
    </>
  );
}
