"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Pencil, SmilePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
  toggleReaction,
  type CommentData,
} from "@/lib/actions/comment";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { CommentEditor } from "@/components/task/comment-editor";
import type { MemberOption } from "@/components/task/types";

const QUICK_EMOJIS = ["👍", "✅", "🎉", "❤️", "😂"];

function relativeTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function TaskComments({
  taskId,
  members,
  currentUserId,
}: {
  taskId: string;
  members: MemberOption[];
  currentUserId: string;
}) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    const data = await getTaskComments(taskId);
    setComments(data);
  }, [taskId]);

  // Atualização quase em tempo real via polling leve (só com a aba visível).
  // Substitui a antiga assinatura Realtime pela chave anon, agora bloqueada por RLS.
  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 20000);
    return () => clearInterval(id);
  }, [taskId, load]);

  function add(html: string) {
    startTransition(async () => {
      const r = await createComment(taskId, html);
      if (r.error) toast.error(r.error);
      else load();
    });
  }

  function saveEdit(commentId: string, html: string) {
    startTransition(async () => {
      const r = await updateComment(commentId, html);
      if (r.error) toast.error(r.error);
      else {
        setEditingId(null);
        load();
      }
    });
  }

  function remove(commentId: string) {
    if (!window.confirm("Excluir este comentário?")) return;
    startTransition(async () => {
      const r = await deleteComment(commentId);
      if (r.error) toast.error(r.error);
      else load();
    });
  }

  function react(commentId: string, emoji: string) {
    setPickerFor(null);
    startTransition(async () => {
      const r = await toggleReaction(commentId, emoji);
      if (r.error) toast.error(r.error);
      else load();
    });
  }

  const memberList = members.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground">Comentários ({comments.length})</Label>

      <div className="space-y-4">
        {comments.map((c) => {
          const grouped = new Map<string, { count: number; mine: boolean }>();
          for (const r of c.reactions) {
            const g = grouped.get(r.emoji) ?? { count: 0, mine: false };
            g.count += 1;
            if (r.userId === currentUserId) g.mine = true;
            grouped.set(r.emoji, g);
          }
          const isMine = c.userId === currentUserId;

          return (
            <div key={c.id} className="flex gap-2">
              <UserAvatar name={c.user.name} image={c.user.image} className="h-7 w-7 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.user.name}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(c.createdAt)}</span>
                  {isMine && (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(c.id)}
                        aria-label="Editar comentário"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        aria-label="Excluir comentário"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === c.id ? (
                  <div className="mt-1">
                    <CommentEditor
                      members={memberList}
                      initialHTML={c.content}
                      submitLabel="Salvar"
                      autoFocus
                      onSubmit={(html) => saveEdit(c.id, html)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div
                    className="prose-sm text-sm [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: c.content }}
                  />
                )}

                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {Array.from(grouped.entries()).map(([emoji, g]) => (
                    <button
                      key={emoji}
                      onClick={() => react(c.id, emoji)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
                        g.mine ? "border-primary bg-primary/10" : "border-input"
                      )}
                    >
                      {emoji} {g.count}
                    </button>
                  ))}
                  <div className="relative">
                    <button
                      onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}
                      aria-label="Adicionar reação"
                      className="rounded-full border border-input p-1 text-muted-foreground hover:bg-accent"
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                    {pickerFor === c.id && (
                      <div className="absolute z-10 mt-1 flex gap-1 rounded-md border bg-popover p-1 shadow-md">
                        {QUICK_EMOJIS.map((e) => (
                          <button
                            key={e}
                            onClick={() => react(c.id, e)}
                            className="rounded p-1 hover:bg-accent"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p>
        )}
      </div>

      <CommentEditor members={memberList} onSubmit={add} />
    </div>
  );
}
