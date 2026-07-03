import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar · Kaizen",
};

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <Card className="rounded-[18px] border-border/80 px-2 py-1 shadow-[0_8px_24px_rgba(61,77,52,0.06)]">
      <CardHeader>
        <CardTitle className="font-brand text-xl">Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm redirectTo={searchParams.callbackUrl} />
      </CardContent>
    </Card>
  );
}
