"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { ROUTES } from "@/app/configs/routes";
import { signIn } from "@/auth";

const signinSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export type SigninState = {
  error?: "invalid_credentials" | "validation" | "unknown";
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export async function signin(
  _prevState: SigninState,
  formData: FormData
): Promise<SigninState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: SigninState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = issue.message;
      }
    }

    return { error: "validation", fieldErrors };
  }

  const redirectTo =
    formData.get("redirectTo")?.toString() || ROUTES.LEARN.HOME;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "invalid_credentials" };
    }

    throw error;
  }

  return {};
}
