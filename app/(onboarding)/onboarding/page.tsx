import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Criar workspace · Kaizen",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6">
        <Logo markSize={34} textSize={22} />
      </div>
      <Card className="w-full max-w-md rounded-[18px] shadow-[0_8px_24px_rgba(61,77,52,0.06)]">
        <CardHeader>
          <CardTitle>Crie seu workspace</CardTitle>
          <CardDescription>
            Um workspace é o espaço compartilhado da sua equipe. Você também pode entrar em um
            existente através de um link de convite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
