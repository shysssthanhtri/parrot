"use client";

import Link from "next/link";
import { useActionState } from "react";

import { GoogleAuthButton } from "@/app/(auth)/_components/google-auth-button";
import { signup, type SignupState } from "@/app/(auth)/signup/actions";
import { ROUTES, signInUrl } from "@/app/configs/routes";
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

const initialState: SignupState = {};

const formErrorMessages: Record<NonNullable<SignupState["error"]>, string> = {
  email_taken: "This email is already registered.",
  validation: "Please fix the errors below.",
  unknown: "Something went wrong. Please try again.",
};

type SignupFormProps = {
  className?: string;
};

export function SignupForm({ className }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Sign up with Google or create a credentials account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {state.error && !state.fieldErrors && (
                <FieldError>{formErrorMessages[state.error]}</FieldError>
              )}

              <Field>
                <GoogleAuthButton
                  label="Continue with Google"
                  callbackUrl={ROUTES.LEARN.HOME}
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
                <Field className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  </Field>
                  <Field data-invalid={!!state.fieldErrors?.confirmPassword}>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirm password
                    </FieldLabel>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      aria-invalid={!!state.fieldErrors?.confirmPassword}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
                {state.fieldErrors?.password && (
                  <FieldError>{state.fieldErrors.password}</FieldError>
                )}
                {state.fieldErrors?.confirmPassword && (
                  <FieldError>{state.fieldErrors.confirmPassword}</FieldError>
                )}
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Creating account..." : "Create account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link href={signInUrl()}>Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
