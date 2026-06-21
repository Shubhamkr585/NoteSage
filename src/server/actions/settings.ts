"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

interface ProfileUpdateInput {
  name: string;
  bio?: string | null;
  theme?: string;
  accentColor?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  productUpdates?: boolean;
}

export async function updateProfileAction(data: ProfileUpdateInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!data.name.trim()) {
    throw new Error("Name cannot be empty");
  }

  // Update in database
  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      bio: data.bio,
      theme: data.theme,
      accentColor: data.accentColor,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      productUpdates: data.productUpdates,
    },
  });

  revalidatePath("/settings");
}
