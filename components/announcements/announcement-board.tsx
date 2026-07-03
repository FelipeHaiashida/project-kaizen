"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Pin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAnnouncement,
  markAnnouncementsRead,
  type AnnouncementData,
} from "@/lib/actions/announcement";
import { LEVEL_META } from "@/lib/validations/announcement";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { AnnouncementFormDialog } from "@/components/announcements/announcement-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function relativeTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function AnnouncementCard({ a, canManage }: { a: AnnouncementData; canManage: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const meta = LEVEL_META[a.level] ?? LEVEL_META.NORMAL;

  function onDelete() {
    if (!window.confirm("Excluir este aviso?")) return;
    startTransition(async () => {
      const r = await deleteAnnouncement(a.id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Aviso excluído");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card" style={{ borderLeft: `4px solid ${meta.color}` }}>
      <div className="flex items-start gap-2 p-4">
        <UserAvatar name={a.author.name} image={a.author.image} className="h-8 w-8 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{a.title}</h3>
            {a.pinned && (
              <span className="flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                <Pin className="h-3 w-3" /> Fixado
              </span>
            )}
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {a.author.name} · {relativeTime(a.createdAt)}
          </p>
          <div
            className="prose-sm mt-2 text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: a.content }}
          />
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isPending}
              aria-label={`Ações do aviso ${a.title}`}
              className="rounded p-1 text-muted-foreground hover:bg-accent focus:outline-none"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {canManage && (
        <AnnouncementFormDialog
          mode="edit"
          announcementId={a.id}
          initial={{
            title: a.title,
            content: a.content,
            level: a.level as "NORMAL" | "IMPORTANT" | "URGENT",
            pinned: a.pinned,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  );
}

export function AnnouncementBoard({
  announcements,
  canManage,
}: {
  announcements: AnnouncementData[];
  canManage: boolean;
}) {
  const router = useRouter();

  // Marca todos como lidos ao visualizar
  useEffect(() => {
    if (announcements.some((a) => !a.read)) {
      markAnnouncementsRead().then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Avisos</h1>
        {canManage && (
          <AnnouncementFormDialog
            mode="create"
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo aviso
              </Button>
            }
          />
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum aviso ainda.{canManage ? " Publique o primeiro para sua equipe." : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} a={a} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
