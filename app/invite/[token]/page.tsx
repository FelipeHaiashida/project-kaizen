import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { AcceptInvitationButton } from "@/components/workspace/accept-invitation-button";

export const metadata: Metadata = {
  title: "Convite · Kaizen",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-6 text-center">
        <span className="text-2xl font-bold tracking-tight">Kaizen</span>
        <span className="ml-2 text-sm text-primary">改善</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await db.invitation.findUnique({
    where: { token: params.token },
    include: {
      workspace: { select: { name: true, slug: true, logo: true } },
      invitedBy: { select: { name: true } },
    },
  });

  const invalid =
    !invitation ||
    (invitation.email !== null && invitation.acceptedAt !== null) ||
    invitation.expiresAt < new Date();

  if (invalid) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Convite indisponível</CardTitle>
            <CardDescription>
              Este link de convite é inválido, já foi utilizado ou expirou. Peça um novo à sua
              equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const session = await auth();
  const inviteUrl = `/invite/${params.token}`;

  return (
    <Shell>
      <Card>
        <CardHeader className="items-center text-center">
          <UserAvatar
            name={invitation.workspace.name}
            image={invitation.workspace.logo}
            className="mb-2 h-14 w-14 rounded-md text-xl"
          />
          <CardTitle>Entrar em {invitation.workspace.name}</CardTitle>
          <CardDescription>
            {invitation.invitedBy.name} convidou você para participar deste workspace no Kaizen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {session?.user ? (
            <AcceptInvitationButton token={params.token} />
          ) : (
            <>
              <Button asChild className="w-full">
                <Link href={`/login?callbackUrl=${encodeURIComponent(inviteUrl)}`}>
                  Entrar para aceitar
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/register?callbackUrl=${encodeURIComponent(inviteUrl)}`}>
                  Criar conta
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
