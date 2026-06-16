import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { signInUrl } from "@/app/configs/routes";
import { auth } from "@/auth";

import { LearnHeader } from "./_components/learn-header";

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
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <LearnHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </SessionProvider>
  );
}
