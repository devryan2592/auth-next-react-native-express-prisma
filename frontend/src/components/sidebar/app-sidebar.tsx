"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import React from "react";
import { getMenuList } from "@/lib/menu-list";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, GalleryVerticalEnd } from "lucide-react";
import AppSidebarFooter from "./app-sidebar-footer";
import { useIsMobile } from "@/hooks/use-mobile";
// import { useAuthStore } from "@/lib/stores/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
// import { authService } from "@/lib/services/auth";

const AppSidebar = () => {
  const pathname = usePathname();
  const menuList = getMenuList(pathname);
  const isMobile = useIsMobile();
  // const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // await authService.logout();
      // router.push("/auth/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  // if (!user) return null;

  const user = {
    id: "1",
    email: "test@test.com",
    password: "123456",
    isVerified: true,
    isTwoFactorEnabled: false,
    name: "Test User",
  };

  return (
    <Sidebar collapsible="icon" className="z-50">
      <SidebarHeader>
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  Smart Turn Holidays
                </span>
                <span className="truncate text-xs">Admin Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mb-2" />
      <SidebarContent>
        {menuList.map((menuListItem, index) => (
          <SidebarGroup key={menuListItem.groupLabel + index} className="py-1">
            {menuListItem.groupLabel && (
              <SidebarGroupLabel className="text-xs">
                {menuListItem.groupLabel}
              </SidebarGroupLabel>
            )}

            <SidebarMenu className="gap-0">
              {menuListItem.menus.map((listItem) => (
                <React.Fragment key={listItem.label}>
                  {listItem.submenus && listItem.submenus.length !== 0 ? (
                    <Collapsible
                      key={listItem.label + index}
                      asChild
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={listItem.label}>
                            {listItem.icon && <listItem.icon />}
                            <span>{listItem.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {listItem.submenus?.map((item, index) => (
                              <SidebarMenuSubItem key={item.label}>
                                <SidebarMenuSubButton asChild>
                                  <Link
                                    href={item.href}
                                    className="flex items-center gap-2"
                                  >
                                    {item.icon && <item.icon />}
                                    <span className="">{item.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip={listItem.label}>
                        {listItem.icon && <listItem.icon />}
                        <Link href={listItem.href}>{listItem.label}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarFooter
          user={user}
          isMobile={isMobile}
          onLogout={handleLogout}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
