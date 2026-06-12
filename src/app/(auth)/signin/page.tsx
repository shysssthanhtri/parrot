import type { Metadata } from "next";

import { SigninForm } from "./_components/signin-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Parrot to access the learner space.",
};

type SigninPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function SigninPage({ searchParams }: SigninPageProps) {
  const params = await searchParams;

  return (
    <SigninForm callbackUrl={params.callbackUrl} authError={params.error} />
  );
}
