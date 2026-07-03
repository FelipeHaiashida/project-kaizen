"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";

import { revokeInvitation } from "@/lib/actions/invitation";
import { Button } from "@/components/ui/button";

export function RevokeInvitationButton({
  invitationId,
  email,
}: {
  invitationId: string;
  email: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Cancelar o convite de ${email}?`)) return;
    startTransition(async () => {
      const result = await revokeInvitation(invitationId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Convite cancelado");
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={isPending}
      aria-label={`Cancelar convite de ${email}`}
    >
      <X className="h-4 w-4 text-destructive" />
    </Button>
  );
}
