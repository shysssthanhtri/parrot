import { SessionProvider } from "next-auth/react";

import { auth } from "@/auth";

import { SiteHeader } from "./_components/site-header";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </SessionProvider>
  );
}
