import { SettingsNav } from "@/components/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="font-brand text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu perfil, o workspace e suas notificações em um só lugar.
          </p>
        </div>
        <SettingsNav />
      </div>
      {children}
    </div>
  );
}
