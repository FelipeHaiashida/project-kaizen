import { redirect } from "next/navigation";

/** Entrada do hub de Configurações — leva para a primeira aba (Perfil). */
export default function SettingsPage() {
  redirect("/settings/profile");
}
