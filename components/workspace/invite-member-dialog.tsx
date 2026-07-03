"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/invitation";
import { inviteMember } from "@/lib/actions/invitation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  function onSubmit(values: InviteMemberInput) {
    startTransition(async () => {
      const result = await inviteMember(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Convite enviado");
        reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Convidar por email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            Envie um convite por email. A pessoa entra ao aceitar o link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="pessoa@empresa.com"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Papel</Label>
            <select
              id="invite-role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("role")}
            >
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
