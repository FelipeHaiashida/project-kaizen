"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Drawer da barra lateral para telas pequenas. O `children` é o SidebarContent
 * (renderizado no servidor e passado como slot). Fecha automaticamente ao navegar.
 */
export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o drawer sempre que a rota muda (usuário clicou num link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[248px] max-w-[80vw] border-none bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
