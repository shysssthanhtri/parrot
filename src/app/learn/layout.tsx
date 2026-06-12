import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { SiteHeader } from "@/app/(marketing)/_components/site-header";
import { signInUrl } from "@/app/configs/routes";
import { auth } from "@/auth";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(signInUrl());
  }

  return (
    <SessionProvider session={session}>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </SessionProvider>
  );
}
