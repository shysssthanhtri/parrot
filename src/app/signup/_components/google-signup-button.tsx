"use client";

import { signIn } from "next-auth/react";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";

import { GoogleIcon } from "./google-icon";

export function GoogleSignupButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => signIn("google", { callbackUrl: ROUTES.LEARN.HOME })}
    >
      <GoogleIcon />
      Sign up with Google
    </Button>
  );
}
