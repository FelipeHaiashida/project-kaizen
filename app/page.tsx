import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Logo markSize={44} textSize={28} />
        <h1 className="font-brand text-4xl font-bold tracking-tight sm:text-5xl">
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
