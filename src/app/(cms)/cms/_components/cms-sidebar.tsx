"use client";

import {
  AudioLines,
  ChevronRight,
  Home,
  type LucideIcon,
  MicVocal,
  Settings,
  Tag,
  Text,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { APP_CONFIG } from "@/app/configs/app";
import { ROUTES } from "@/app/configs/routes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { UserButton } from "./user-button";

const settingsSubItems = [
  { title: "Personal", url: ROUTES.CMS.SETTINGS_PERSONAL },
  { title: "CMS", url: ROUTES.CMS.SETTINGS_CMS },
] as const;

export const CMSSidebar = () => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isSettingsRoute = pathname.startsWith(ROUTES.CMS.SETTINGS);
  const [settingsOpenOverride, setSettingsOpenOverride] = useState<
    boolean | null
  >(null);
  const [prevIsSettingsRoute, setPrevIsSettingsRoute] =
    useState(isSettingsRoute);

  if (isSettingsRoute !== prevIsSettingsRoute) {
    setPrevIsSettingsRoute(isSettingsRoute);
    if (!isSettingsRoute) {
      setSettingsOpenOverride(null);
    }
  }

  const settingsOpen =
    settingsOpenOverride !== null ? settingsOpenOverride : isSettingsRoute;

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
      title: "Topics",
      url: ROUTES.CMS.TOPICS,
      icon: Tag,
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
                      <Link
                        href={item.url}
                        prefetch={false}
                        onClick={closeMobileSidebar}
                      >
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
              <Collapsible
                asChild
                open={settingsOpen}
                onOpenChange={setSettingsOpenOverride}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Settings">
                      <Settings />
                      <span>Settings</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {settingsSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.url}
                          >
                            <Link
                              href={item.url}
                              prefetch={false}
                              onClick={closeMobileSidebar}
                            >
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
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
