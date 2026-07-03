import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta · Kaizen",
};

export default function RegisterPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <Card className="rounded-[18px] border-border/80 px-2 py-1 shadow-[0_8px_24px_rgba(61,77,52,0.06)]">
      <CardHeader>
        <CardTitle className="font-brand text-xl">Criar conta</CardTitle>
        <CardDescription>Comece a organizar o trabalho da sua equipe</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm redirectTo={searchParams.callbackUrl} />
      </CardContent>
    </Card>
  );
}
