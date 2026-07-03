import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace, canManageWorkspace } from "@/lib/workspace";
import { ROLE_LABELS } from "@/lib/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { CopyInviteButton } from "@/components/workspace/copy-invite-button";
import { RemoveMemberButton } from "@/components/workspace/remove-member-button";

export const metadata: Metadata = {
  title: "Workspace · Kaizen",
};

export default async function WorkspaceSettingsPage() {
  const session = await auth();
  const active = await getActiveWorkspace();
  if (!active || !session?.user?.id) redirect("/onboarding");

  const canManage = canManageWorkspace(active.role);
  const isOwner = active.role === "OWNER";

  const members = await db.workspaceMember.findMany({
    where: { workspaceId: active.workspace.id },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Workspace</CardTitle>
            <CardDescription>Edite o nome, o slug e o logo da sua equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceSettingsForm
              workspace={{
                name: active.workspace.name,
                slug: active.workspace.slug,
                logo: active.workspace.logo,
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Membros</CardTitle>
            <CardDescription>{members.length} membro(s) neste workspace</CardDescription>
          </div>
          {canManage && <CopyInviteButton />}
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => {
              const isSelf = m.user.id === session.user.id;
              const removable = isOwner && m.role !== "OWNER" && !isSelf;
              return (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={m.user.name} image={m.user.image} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.user.name}
                      {isSelf && <span className="text-muted-foreground"> (você)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                    {ROLE_LABELS[m.role]}
                  </span>
                  {removable && <RemoveMemberButton memberId={m.id} memberName={m.user.name} />}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
