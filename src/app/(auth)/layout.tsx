import { redirect } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";
import { auth } from "@/auth";

import { AuthPageShell } from "./_components/auth-page-shell";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user) {
    redirect(ROUTES.LEARN.HOME);
  }

  return <AuthPageShell>{children}</AuthPageShell>;
}
