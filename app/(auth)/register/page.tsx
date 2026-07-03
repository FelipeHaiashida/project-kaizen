import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta · Kaizen",
};

export default function RegisterPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Comece a organizar o trabalho da sua equipe</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm redirectTo={searchParams.callbackUrl} />
      </CardContent>
    </Card>
  );
}
