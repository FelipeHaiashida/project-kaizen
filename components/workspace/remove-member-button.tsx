"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeMember } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";

export function RemoveMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Remover ${memberName} do workspace?`)) return;
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Membro removido");
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
      aria-label={`Remover ${memberName}`}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
