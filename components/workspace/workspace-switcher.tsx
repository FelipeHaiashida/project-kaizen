"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";

import { switchWorkspace } from "@/lib/actions/workspace";
import { UserAvatar } from "@/components/user-avatar";
import { canManageWorkspaceRole } from "@/lib/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WorkspaceSummary = {
  slug: string;
  name: string;
  logo: string | null;
};

interface WorkspaceSwitcherProps {
  active: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  role: "OWNER" | "ADMIN" | "MEMBER";
}

export function WorkspaceSwitcher({ active, workspaces, role }: WorkspaceSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  function onSelect(slug: string) {
    if (slug === active.slug) return;
    startTransition(() => switchWorkspace(slug));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <UserAvatar name={active.name} image={active.logo} className="h-6 w-6 rounded text-xs" />
        <span className="flex-1 truncate font-medium">{active.name}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[15rem]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.slug} onSelect={() => onSelect(ws.slug)}>
            <UserAvatar name={ws.name} image={ws.logo} className="h-5 w-5 rounded text-[10px]" />
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.slug === active.slug && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {canManageWorkspaceRole(role) && (
          <DropdownMenuItem asChild>
            <Link href="/settings/workspace">
              <Settings className="h-4 w-4" />
              Configurações do workspace
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/onboarding">
            <Plus className="h-4 w-4" />
            Criar novo workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
