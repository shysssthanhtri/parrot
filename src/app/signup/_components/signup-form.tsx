"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInUrl } from "@/app/configs/routes";
import { signup, type SignupState } from "@/app/signup/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { GoogleSignupButton } from "./google-signup-button";

const initialState: SignupState = {};

const formErrorMessages: Record<NonNullable<SignupState["error"]>, string> = {
  email_taken: "This email is already registered.",
  validation: "Please fix the errors below.",
  unknown: "Something went wrong. Please try again.",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <GoogleSignupButton />

      <div className="relative -my-2 h-5 text-sm">
        <Separator className="absolute inset-0 top-1/2" />
        <span className="relative mx-auto block w-fit bg-card px-2 text-center text-muted-foreground">
          or
        </span>
      </div>

      {state.error && !state.fieldErrors && (
        <FieldError>{formErrorMessages[state.error]}</FieldError>
      )}

      <FieldSet>
        <FieldGroup>
          <Field data-invalid={!!state.fieldErrors?.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && (
              <FieldError>{state.fieldErrors.email}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.fieldErrors?.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={!!state.fieldErrors?.password}
            />
            {state.fieldErrors?.password && (
              <FieldError>{state.fieldErrors.password}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!state.fieldErrors?.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={!!state.fieldErrors?.confirmPassword}
            />
            {state.fieldErrors?.confirmPassword && (
              <FieldError>{state.fieldErrors.confirmPassword}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </FieldSet>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={signInUrl()}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
