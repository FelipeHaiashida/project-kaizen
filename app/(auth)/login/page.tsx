import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar · Kaizen",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
