"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ShieldCheck, ShieldMinus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeMember, updateMemberRole } from "@/lib/actions/workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MemberActions({
  memberId,
  memberName,
  memberRole,
  canRemove,
}: {
  memberId: string;
  memberName: string;
  memberRole: "ADMIN" | "MEMBER";
  canRemove: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Feito");
        router.refresh();
      }
    });
  }

  function onRemove() {
    if (!window.confirm(`Remover ${memberName} do workspace?`)) return;
    run(() => removeMember(memberId));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        aria-label={`Ações de ${memberName}`}
        className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {memberRole === "MEMBER" ? (
          <DropdownMenuItem onSelect={() => run(() => updateMemberRole(memberId, "ADMIN"))}>
            <ShieldCheck className="h-4 w-4" />
            Tornar Admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => run(() => updateMemberRole(memberId, "MEMBER"))}>
            <ShieldMinus className="h-4 w-4" />
            Tornar Membro
          </DropdownMenuItem>
        )}
        {canRemove && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRemove} className="text-destructive">
              <Trash2 className="h-4 w-4" />
              Remover do workspace
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
