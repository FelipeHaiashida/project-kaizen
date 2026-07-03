"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { acceptInvitation } from "@/lib/actions/invitation";
import { Button } from "@/components/ui/button";

export function AcceptInvitationButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await acceptInvitation(token);
      // Sucesso redireciona no servidor; só retorna aqui em caso de erro.
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button className="w-full" onClick={onClick} disabled={isPending}>
      {isPending ? "Entrando..." : "Aceitar convite"}
    </Button>
  );
}
