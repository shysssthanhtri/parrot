import { LandingHeader } from "./_components/landing-header";

export const dynamic = "force-static";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
