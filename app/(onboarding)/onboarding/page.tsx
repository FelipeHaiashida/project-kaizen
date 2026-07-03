import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";

export const metadata: Metadata = {
  title: "Criar workspace · Kaizen",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-6 text-center">
        <span className="text-2xl font-bold tracking-tight">Kaizen</span>
        <span className="ml-2 text-sm text-primary">改善</span>
      </div>
      <Card className="w-full max-w-md">
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
