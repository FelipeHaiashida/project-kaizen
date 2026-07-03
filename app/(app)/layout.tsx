import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Reforço à proteção do middleware (garante sessão nas Server Components filhas)
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">Kaizen</span>
          <span className="text-xs text-primary">改善</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
