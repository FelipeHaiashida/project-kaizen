import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceProjects } from "@/lib/project";
import { getUnreadAnnouncementCount } from "@/lib/actions/announcement";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { SidebarContent } from "@/components/sidebar-content";
import { MobileSidebar } from "@/components/mobile-sidebar";
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

  const sidebar = (
    <SidebarContent
      active={{
        slug: active.workspace.slug,
        name: active.workspace.name,
        logo: active.workspace.logo,
      }}
      workspaces={workspaces}
      role={active.role}
      unreadAnnouncements={unreadAnnouncements}
      projects={projects}
      user={{ name: user?.name ?? session.user.name, image: user?.image }}
    />
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[248px] shrink-0 bg-sidebar text-sidebar-foreground lg:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b bg-card/60 px-4 py-3 sm:gap-3 sm:px-6">
          <MobileSidebar>{sidebar}</MobileSidebar>
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
            <span className="hidden md:inline">{user?.name ?? session.user.name}</span>
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
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
