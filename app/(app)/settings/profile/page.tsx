import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export const metadata: Metadata = {
  title: "Perfil · Kaizen",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, bio: true, image: true, password: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais e foto</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{ name: user.name, email: user.email, bio: user.bio, image: user.image }}
          />
        </CardContent>
      </Card>

      {user.password && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Senha</CardTitle>
            <CardDescription>Altere a senha de acesso à sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
