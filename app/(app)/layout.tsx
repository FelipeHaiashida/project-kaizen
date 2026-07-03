import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceProjects } from "@/lib/project";
import { getUnreadAnnouncementCount } from "@/lib/actions/announcement";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";
import { AppSidebarNav } from "@/components/app-sidebar-nav";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { ProjectsNav } from "@/components/project/projects-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/search/global-search";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  const workspaces = active.memberships.map((m) => ({
    slug: m.workspace.slug,
    name: m.workspace.name,
    logo: m.workspace.logo,
  }));

  const projects = await getWorkspaceProjects(active.workspace.id);
  const unreadAnnouncements = await getUnreadAnnouncementCount();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[248px] flex-col gap-3 bg-sidebar px-3 py-4 text-sidebar-foreground">
        <div className="px-1.5 pb-1">
          <Logo variant="light" markSize={30} textSize={17} />
        </div>
        <WorkspaceSwitcher
          active={{
            slug: active.workspace.slug,
            name: active.workspace.name,
            logo: active.workspace.logo,
          }}
          workspaces={workspaces}
          role={active.role}
        />
        <AppSidebarNav unreadAnnouncements={unreadAnnouncements} />
        <div className="flex-1 overflow-y-auto">
          <ProjectsNav projects={projects} workspaceSlug={active.workspace.slug} />
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
          <span className="truncate text-[12.5px] font-medium">
            {user?.name ?? session.user.name}
          </span>
        </Link>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card/60 px-6 py-3">
          <GlobalSearch
            workspaceSlug={active.workspace.slug}
            projects={projects
              .filter((p) => !p.archived)
              .map((p) => ({ id: p.id, name: p.name, icon: p.icon }))}
          />
          <div className="flex-1" />
          <NotificationBell userId={session.user.id} />
          <Link
            href="/settings/profile"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <UserAvatar name={user?.name} image={user?.image} className="h-7 w-7 text-xs" />
            <span>{user?.name ?? session.user.name}</span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
