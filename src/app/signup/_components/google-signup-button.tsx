"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

import { GoogleIcon } from "./google-icon";

export function GoogleSignupButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => signIn("google", { callbackUrl: "/" })}
    >
      <GoogleIcon />
      Sign up with Google
    </Button>
  );
}
