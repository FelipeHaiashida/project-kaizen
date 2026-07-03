import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium text-primary">改善 · Kaizen</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Gerencie projetos e tarefas da sua equipe
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Uma plataforma de gerenciamento de projetos estilo ClickUp — quadros, listas, calendário e
          colaboração em tempo real.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/register">Começar agora</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
