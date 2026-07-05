import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import { canManageWorkspaceRole } from "@/lib/roles";
import { PRIORITY_MAP } from "@/lib/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { DashboardBanner } from "@/components/dashboard-banner";
import { PriorityIcon } from "@/components/task/priority-icon";

export const metadata: Metadata = {
  title: "Dashboard · Kaizen",
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding");

  const userId = session.user.id;
  const workspaceId = active.workspace.id;
  const slug = active.workspace.slug;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const weekAgo = new Date(todayStart.getTime() - 6 * 86400000);

  // "Concluído" = status de maior ordem em cada projeto
  const projects = await db.project.findMany({
    where: { workspaceId },
    select: { id: true, statuses: { select: { id: true, order: true } } },
  });
  const doneStatusIds = new Set<string>();
  for (const p of projects) {
    if (p.statuses.length === 0) continue;
    const done = p.statuses.reduce((max, s) => (s.order > max.order ? s : max), p.statuses[0]);
    doneStatusIds.add(done.id);
  }

  const assigned = await db.task.findMany({
    where: { assignees: { some: { userId } }, list: { project: { workspaceId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      statusId: true,
      status: { select: { name: true, color: true } },
      updatedAt: true,
      list: { select: { project: { select: { id: true, name: true, icon: true } } } },
    },
  });

  const isDone = (t: (typeof assigned)[number]) => doneStatusIds.has(t.statusId);
  const open = assigned.filter((t) => !isDone(t));
  const overdue = open.filter((t) => t.dueDate && t.dueDate < todayStart);
  const dueToday = open.filter((t) => t.dueDate && t.dueDate >= todayStart && t.dueDate < todayEnd);
  const doneThisWeek = assigned.filter((t) => isDone(t) && t.updatedAt >= weekAgo).length;

  const myTasks = [...open].sort((a, b) => {
    const av = a.dueDate ? a.dueDate.getTime() : Infinity;
    const bv = b.dueDate ? b.dueDate.getTime() : Infinity;
    return av - bv;
  });

  const recentComments = await db.comment.findMany({
    where: { task: { list: { project: { workspaceId } } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
      task: { select: { title: true, list: { select: { project: { select: { id: true } } } } } },
    },
  });

  const recentProjects = await db.project.findMany({
    where: { workspaceId, archived: false },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, name: true, icon: true, color: true },
  });

  const firstName = session.user.name?.split(" ")[0] ?? "";

  const summaryCards = [
    { label: "Concluídas esta semana", value: doneThisWeek, icon: CheckCircle2, color: "#10B981" },
    { label: "Em progresso", value: open.length, icon: Clock, color: "#3B82F6" },
    { label: "Atrasadas", value: overdue.length, icon: AlertTriangle, color: "#DC2626" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-brand text-2xl font-bold tracking-tight">Olá, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Seu resumo no workspace {active.workspace.name}
        </p>
      </div>

      <DashboardBanner
        bannerImage={active.workspace.bannerImage}
        canEdit={canManageWorkspaceRole(active.role)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${c.color}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: c.color }} />
                </span>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <HighlightList
            title="Vencendo hoje"
            tasks={dueToday}
            slug={slug}
            emptyLabel="Nada vence hoje"
            accent="#CA8A04"
          />
          <HighlightList
            title="Atrasadas"
            tasks={overdue}
            slug={slug}
            emptyLabel="Nada atrasado"
            accent="#DC2626"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Minhas tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa atribuída a você. 🎉</p>
          ) : (
            <ul className="divide-y">
              {myTasks.slice(0, 12).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${slug}/${t.list.project.id}`}
                    className="flex items-center gap-2 py-2 text-sm hover:text-primary"
                  >
                    <PriorityIcon priority={t.priority} />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.list.project.icon} {t.list.project.name}
                    </span>
                    {t.dueDate && (
                      <span
                        className={`w-12 text-right text-xs ${
                          t.dueDate < todayStart
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {fmtDate(t.dueDate)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividade recente.</p>
            ) : (
              <ul className="space-y-3">
                {recentComments.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <UserAvatar
                      name={c.user.name}
                      image={c.user.image}
                      className="h-6 w-6 text-[10px]"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{c.user.name}</span> comentou em{" "}
                      <span className="text-muted-foreground">{c.task.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projetos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/${slug}/${p.id}`}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded"
                      style={{ backgroundColor: `${p.color}20` }}
                    >
                      {p.icon}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HighlightList({
  title,
  tasks,
  slug,
  emptyLabel,
  accent,
}: {
  title: string;
  tasks: {
    id: string;
    title: string;
    dueDate: Date | null;
    priority: keyof typeof PRIORITY_MAP;
    list: { project: { id: string } };
  }[];
  slug: string;
  emptyLabel: string;
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          {title} ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-1">
            {tasks.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/${slug}/${t.list.project.id}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <PriorityIcon priority={t.priority} />
                  <span className="truncate">{t.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
