"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { getInviteToken } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";

export function CopyInviteButton() {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function onClick() {
    startTransition(async () => {
      const result = await getInviteToken();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const url = `${window.location.origin}/invite/${result.token}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link de convite copiado");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.message("Copie o link manualmente:", { description: url });
      }
    });
  }

  return (
    <Button type="button" size="sm" onClick={onClick} disabled={isPending}>
      <Copy className="h-4 w-4" />
      {copied ? "Copiado!" : "Copiar link de convite"}
    </Button>
  );
}
