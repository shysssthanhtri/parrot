"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

import { GoogleIcon } from "./google-icon";

type GoogleAuthButtonProps = {
  label: string;
  callbackUrl: string;
};

export function GoogleAuthButton({
  label,
  callbackUrl,
}: GoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => signIn("google", { callbackUrl })}
    >
      <GoogleIcon className="size-4" />
      {label}
    </Button>
  );
}
