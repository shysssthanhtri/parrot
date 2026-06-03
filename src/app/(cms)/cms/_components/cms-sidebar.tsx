"use client";

import {
  AudioLines,
  Home,
  type LucideIcon,
  MicVocal,
  Settings,
  Text,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_CONFIG } from "@/app/configs/app";
import { ROUTES } from "@/app/configs/routes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { UserButton } from "./user-button";

export const CMSSidebar = () => {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      url: ROUTES.CMS.DASHBOARD,
      icon: Home,
    },
    {
      title: "Voices",
      url: ROUTES.CMS.VOICES,
      icon: MicVocal,
    },
    {
      title: "Scripts",
      url: ROUTES.CMS.SCRIPTS,
      icon: Text,
    },
    {
      title: "Speeches",
      url: ROUTES.CMS.SPEECHES,
      icon: AudioLines,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row mt-2">
        <Image
          src="/icon.svg"
          alt={APP_CONFIG.TITLE}
          width={28}
          height={28}
          className="rounded-sm ml-0.5"
        />
        <span className="group-data-[collapsible=icon]:hidden font-semibold text-lg tracking-tighter text-foreground">
          {APP_CONFIG.TITLE}
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!!item.url}
                    onClick={item.onClick}
                    tooltip={item.title}
                    isActive={
                      item.url
                        ? item.url === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.url)
                        : false
                    }
                  >
                    {item.url ? (
                      <Link href={item.url} prefetch={false}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      <>
                        <item.icon />
                        <span>{item.title}</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mb-2">
        <UserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  onClick?: () => void;
}
