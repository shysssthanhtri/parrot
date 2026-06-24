import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { signInUrl } from "@/app/configs/routes";
import { auth } from "@/auth";
import { getLearnRequestTimer } from "@/lib/server-timing";

import { LearnHeader } from "./_components/learn-header";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const timer = getLearnRequestTimer();
  const session = await timer.measure("auth", () => auth());

  if (!session?.user) {
    redirect(signInUrl());
  }

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <LearnHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
