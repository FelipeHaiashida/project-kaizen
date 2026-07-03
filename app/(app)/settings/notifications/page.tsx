import type { Metadata } from "next";

import { getNotificationSettings } from "@/lib/actions/notification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";

export const metadata: Metadata = {
  title: "Notificações · Kaizen",
};

export default async function NotificationSettingsPage() {
  const settings = await getNotificationSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Notificações</CardTitle>
        <CardDescription>Escolha quais notificações você quer receber</CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationSettingsForm initial={settings} />
      </CardContent>
    </Card>
  );
}
