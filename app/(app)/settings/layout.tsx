import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <nav className="mt-2 flex gap-4 text-sm">
          <Link href="/settings/profile" className="font-medium text-primary hover:underline">
            Perfil
          </Link>
          <Link href="/settings/workspace" className="font-medium text-primary hover:underline">
            Workspace
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
