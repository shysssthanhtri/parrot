import type { Metadata } from "next";

import { SignupForm } from "./_components/signup-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Parrot account to start language shadowing practice.",
};

export default function SignupPage() {
  return <SignupForm />;
}
