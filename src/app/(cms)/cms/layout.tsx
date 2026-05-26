import { cookies } from "next/headers";
import React from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { CMSSidebar } from "./_components/cms-sidebar";

const CMSLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")
    ? cookieStore.get("sidebar_state")?.value === "true"
    : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TooltipProvider delayDuration={0}>
        <CMSSidebar />
        <SidebarInset>{children}</SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default CMSLayout;
