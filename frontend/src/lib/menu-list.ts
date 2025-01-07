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
          href: "/contacts",
          label: "Contacts",
          icon: Users,
          submenus: [
            {
              icon: Eye,
              href: "/contacts",
              label: "All Contacts"
            },
            {
              icon: UserPlus,
              href: "/contacts/new",
              label: "Add Contact"
            }
          ]
        },
        {
          href: "/leads",
          label: "Leads",
          icon: Users,
          submenus: [
            {
              icon: Eye,
              href: "/leads",
              label: "All Leads"
            },
            {
              icon: UserPlus,
              href: "/leads/new",
              label: "Add Lead"
            }
          ]
        },
        
      ]
    },
    {
      groupLabel: "Content",
      menus: [
        {
          href: "/posts",
          label: "Posts",
          icon: SquarePen,
          submenus: [
            {
              icon: SquarePen,
              href: "/posts",
              label: "All Posts"
            },
            {
              icon: SquarePen,
              href: "/posts/new",
              label: "New Post"
            }
          ]
        },
        {
          href: "/categories",
          label: "Categories",
          icon: Bookmark
        },
        {
          href: "/tags",
          label: "Tags",
          icon: Tag
        }
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
          href: "/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
