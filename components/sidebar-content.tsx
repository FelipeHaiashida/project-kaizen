import Link from "next/link";

import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";
import { AppSidebarNav } from "@/components/app-sidebar-nav";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { ProjectsNav } from "@/components/project/projects-nav";
import type { ProjectItem } from "@/components/project/project-nav-item";

export interface SidebarContentProps {
  active: { slug: string; name: string; logo: string | null };
  workspaces: { slug: string; name: string; logo: string | null }[];
  role: "OWNER" | "ADMIN" | "MEMBER";
  unreadAnnouncements: number;
  projects: ProjectItem[];
  user: { name?: string | null; image?: string | null };
}

/** Conteúdo interno da barra lateral, reaproveitado no aside (desktop) e no drawer (mobile). */
export function SidebarContent({
  active,
  workspaces,
  role,
  unreadAnnouncements,
  projects,
  user,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col gap-3 px-3 py-4">
      <div className="px-1.5 pb-1">
        <Logo variant="light" markSize={30} textSize={17} />
      </div>
      <WorkspaceSwitcher active={active} workspaces={workspaces} role={role} />
      <AppSidebarNav unreadAnnouncements={unreadAnnouncements} />
      <div className="flex-1 overflow-y-auto">
        <ProjectsNav projects={projects} workspaceSlug={active.slug} />
      </div>
      <Link
        href="/settings/profile"
        className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 transition-colors hover:bg-sidebar-accent"
      >
        <UserAvatar
          name={user?.name}
          image={user?.image}
          className="h-[26px] w-[26px] text-[11px] [&_span]:bg-[hsl(var(--chip-mint))] [&_span]:text-sidebar"
        />
        <span className="truncate text-[12.5px] font-medium">{user?.name}</span>
      </Link>
    </div>
  );
}
