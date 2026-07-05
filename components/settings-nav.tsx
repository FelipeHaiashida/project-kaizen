"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building2, Bell } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/settings/profile", label: "Perfil", icon: User },
  { href: "/settings/workspace", label: "Workspace", icon: Building2 },
  { href: "/settings/notifications", label: "Notificações", icon: Bell },
];

/** Navegação do hub de Configurações, com destaque para a aba ativa. */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-full bg-secondary p-1">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-card font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
