"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateWorkspaceBanner, removeWorkspaceBanner } from "@/lib/actions/workspace";

const GRADIENT = "linear-gradient(120deg,#5C7A52 0%,#3D4D34 100%)";
const SCRIM = "linear-gradient(to top,rgba(31,38,26,.78),rgba(31,38,26,0))";

export function DashboardBanner({
  bannerImage,
  canEdit,
  className,
}: {
  bannerImage: string | null;
  canEdit: boolean;
  className?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  const src = preview ?? bannerImage;
  const hasImage = !!src;

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.set("banner", file);
    startTransition(async () => {
      const result = await updateWorkspaceBanner(formData);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Banner atualizado");
        router.refresh();
      }
    });
  }

  function onRemove(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const result = await removeWorkspaceBanner();
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Banner removido");
        router.refresh();
      }
    });
  }

  const editable = canEdit && !isPending;

  return (
    <div
      onClick={() => editable && !hasImage && inputRef.current?.click()}
      onDragOver={
        editable
          ? (e) => {
              e.preventDefault();
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={editable ? () => setDragOver(false) : undefined}
      onDrop={
        editable
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }
          : undefined
      }
      className={cn(
        "group relative h-[150px] shrink-0 overflow-hidden rounded-[18px]",
        dragOver && "ring-2 ring-[#c96442] ring-offset-2 ring-offset-background",
        canEdit && !hasImage && "cursor-pointer",
        className
      )}
      style={{ background: GRADIENT }}
    >
      {/* Camada de imagem */}
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt="Banner do workspace" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {/* Convite (estado vazio) */}
      {canEdit && !hasImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center text-[#EFEBDD]">
          <ImagePlus className="h-6 w-6 opacity-90" />
          <span className="text-sm font-medium">Solte a imagem do seu banner</span>
          <span className="text-xs opacity-80">ou clique para procurar um arquivo</span>
        </div>
      )}

      {/* Scrim inferior para legibilidade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]"
        style={{ background: SCRIM }}
      />

      {/* Conteúdo sobreposto */}
      <div className="pointer-events-none absolute inset-x-[22px] bottom-[18px] flex items-end gap-3.5">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/[0.16] text-xl backdrop-blur-sm">
          🍵
        </div>
        <div className="flex-1">
          <div
            className="font-brand text-base font-bold text-[#F6F4EE]"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,.35)" }}
          >
            Pequenas melhorias todo dia levam a grandes resultados.
          </div>
          {canEdit && (
            <div
              className="mt-[3px] text-xs text-[#E7ECDC]"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,.35)" }}
            >
              {hasImage
                ? "Passe o mouse para trocar ou remover a imagem"
                : "Arraste uma imagem para o banner ou clique para procurar"}
            </div>
          )}
        </div>
      </div>

      {/* Controles (hover, quando preenchido) */}
      {canEdit && hasImage && (
        <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Trocar
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-destructive disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        </div>
      )}

      {/* Estado de upload */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}

      {canEdit && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
}
