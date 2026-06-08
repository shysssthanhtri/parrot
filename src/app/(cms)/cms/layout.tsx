import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";
import React from "react";

import { auth } from "@/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { CMSHeader } from "./_components/cms-header";
import { CMSSidebar } from "./_components/cms-sidebar";

const CMSLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")
    ? cookieStore.get("sidebar_state")?.value === "true"
    : true;

  return (
    <SessionProvider session={session}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <TooltipProvider delayDuration={0}>
          <CMSSidebar />
          <SidebarInset>
            <CMSHeader />
            {children}
          </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    </SessionProvider>
  );
};

export default CMSLayout;
