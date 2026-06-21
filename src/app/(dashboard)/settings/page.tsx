import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsClient } from "@/components/features/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  // Fetch the latest profile data from the database
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      bio: true,
      theme: true,
      accentColor: true,
      emailNotifications: true,
      pushNotifications: true,
      productUpdates: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Map null fields to appropriate defaults
  const userProfile = {
    name: user.name,
    email: user.email,
    image: user.image,
    bio: user.bio || "",
    theme: user.theme || "dark",
    accentColor: user.accentColor || "#d0bcff",
    emailNotifications: user.emailNotifications,
    pushNotifications: user.pushNotifications,
    productUpdates: user.productUpdates,
    createdAt: user.createdAt,
  };

  return (
    <div className="flex-1 w-full bg-background min-h-screen text-on-surface">
      <SettingsClient user={userProfile} />
    </div>
  );
}
