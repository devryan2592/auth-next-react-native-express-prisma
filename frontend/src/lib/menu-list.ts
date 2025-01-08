import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  UserPlus,
  Eye
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "CRM",
      menus: [
        {
          href: "/dashboard",
          label: "Contacts",
          icon: Users,
          submenus: [
            {
              icon: Eye,
              href: "/dashboard",
              label: "All Contacts"
            },
            {
              icon: UserPlus,
              href: "/dashboard",
              label: "Add Contact"
            }
          ]
        },
          ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/dashboard/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
