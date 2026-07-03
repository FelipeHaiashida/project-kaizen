import type { Metadata } from "next";
import { IBM_Plex_Sans, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "Kaizen",
  description: "Plataforma de gerenciamento de projetos e tarefas para equipes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          plexSans.variable,
          zenMaru.variable
        )}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
