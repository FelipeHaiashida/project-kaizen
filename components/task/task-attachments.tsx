"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadAttachment, deleteAttachment } from "@/lib/actions/attachment";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { AttachmentItem } from "@/components/task/types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}

export function TaskAttachments({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: AttachmentItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await uploadAttachment(taskId, fd);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Enviado");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteAttachment(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Anexo excluído");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Anexos ({attachments.length})</Label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed py-4 text-xs text-muted-foreground",
          dragOver && "border-primary bg-primary/5"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {isPending ? "Enviando..." : "Arraste aqui ou clique para enviar (máx. 10MB)"}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <ul className="space-y-2">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center gap-2 rounded-md border p-2">
            {isImage(a.name) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.name} className="h-10 w-10 rounded object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{a.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(a.size)} · {new Date(a.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              download={a.name}
              aria-label={`Baixar ${a.name}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => remove(a.id)}
              disabled={isPending}
              aria-label={`Excluir ${a.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
