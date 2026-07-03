import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceProjects } from "@/lib/project";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { ProjectsNav } from "@/components/project/projects-nav";

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

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-muted/20">
        <div className="p-3">
          <WorkspaceSwitcher
            active={{
              slug: active.workspace.slug,
              name: active.workspace.name,
              logo: active.workspace.logo,
            }}
            workspaces={workspaces}
            role={active.role}
          />
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <ProjectsNav projects={projects} workspaceSlug={active.workspace.slug} />
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b px-6 py-3">
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
