"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/validators/auth";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerUser(values: z.infer<typeof registerSchema>) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { email, password, name } = validatedFields.data;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already in use." };
  }

  const hashedPassword = await hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: "User created successfully! You can now log in." };
}

export async function loginUser(values: z.infer<typeof loginSchema>) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." };
        default:
          return { error: "Something went wrong." };
      }
    }
    throw error;
  }
}
