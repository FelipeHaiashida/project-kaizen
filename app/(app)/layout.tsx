import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Reforço à proteção do middleware (garante sessão nas Server Components filhas)
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Busca dados frescos (nome/foto podem ter mudado após a sessão JWT ser emitida)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">Kaizen</span>
          <span className="text-xs text-primary">改善</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/settings/profile"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <UserAvatar name={user?.name} image={user?.image} className="h-7 w-7 text-xs" />
            <span>{user?.name ?? session.user.name}</span>
          </Link>
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
