import type { Metadata } from "next";

import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard · Kaizen",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">
        Olá, {session?.user?.name?.split(" ")[0] ?? "bem-vindo"} 👋
      </h1>
      <p className="text-muted-foreground">
        Você está autenticado como <span className="font-medium">{session?.user?.email}</span>.
      </p>
      <p className="text-sm text-muted-foreground">
        Em breve: suas tarefas, atividade recente e resumo da equipe.
      </p>
    </div>
  );
}
