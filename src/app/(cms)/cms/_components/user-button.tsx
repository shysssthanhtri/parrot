"use client";

import { useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const UserButton = () => {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  console.log(user);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0!">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage
              src={user.image ?? ""}
              alt={user.email ?? "avatar"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="rounded-lg">N/A</AvatarFallback>
          </Avatar>

          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
