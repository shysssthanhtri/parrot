"use client";

import Link from "next/link";
import { useActionState } from "react";

import { GoogleAuthButton } from "@/app/(auth)/_components/google-auth-button";
import { signin, type SigninState } from "@/app/(auth)/signin/actions";
import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: SigninState = {};

const formErrorMessages: Record<NonNullable<SigninState["error"]>, string> = {
  invalid_credentials: "Invalid email or password.",
  validation: "Please fix the errors below.",
  unknown: "Something went wrong. Please try again.",
};

type SigninFormProps = {
  callbackUrl?: string;
  authError?: string;
  className?: string;
};

export function SigninForm({
  callbackUrl,
  authError,
  className,
}: SigninFormProps) {
  const redirectTo = callbackUrl ?? ROUTES.LEARN.HOME;
  const [state, formAction, pending] = useActionState(signin, initialState);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with Google or your email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <FieldGroup>
              {state.error === "invalid_credentials" && (
                <FieldError>{formErrorMessages.invalid_credentials}</FieldError>
              )}

              {authError && !state.error && (
                <FieldError>Invalid email or password.</FieldError>
              )}

              {state.error === "validation" && !state.fieldErrors && (
                <FieldError>{formErrorMessages.validation}</FieldError>
              )}

              {state.error === "unknown" && (
                <FieldError>{formErrorMessages.unknown}</FieldError>
              )}

              <Field>
                <GoogleAuthButton
                  label="Continue with Google"
                  callbackUrl={redirectTo}
                />
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field data-invalid={!!state.fieldErrors?.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
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
                  autoComplete="current-password"
                  required
                  aria-invalid={!!state.fieldErrors?.password}
                />
                {state.fieldErrors?.password && (
                  <FieldError>{state.fieldErrors.password}</FieldError>
                )}
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Signing in..." : "Sign in"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href={ROUTES.PUBLIC.SIGNUP}>Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
