"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/avisos", label: "Avisos", icon: Megaphone },
];

export function AppSidebarNav({ unreadAnnouncements }: { unreadAnnouncements: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-sidebar-active font-semibold text-sidebar-active-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Icon className="h-[15px] w-[15px]" />
            {label}
            {href === "/avisos" && unreadAnnouncements > 0 && (
              <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[hsl(var(--chip-mint))] px-1.5 text-[10px] font-bold text-sidebar">
                {unreadAnnouncements > 9 ? "9+" : unreadAnnouncements}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
