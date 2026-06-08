"use client";

import Image from "next/image";

import { APP_CONFIG } from "@/app/configs/app";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const CMSHeader = () => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
      <SidebarTrigger />
      <Image
        src="/icon.svg"
        alt={APP_CONFIG.TITLE}
        width={24}
        height={24}
        className="rounded-sm"
      />
      <span className="font-semibold text-lg tracking-tighter text-foreground">
        {APP_CONFIG.TITLE}
      </span>
    </header>
  );
};
