"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check } from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/lib/actions/notification";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function relativeTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const data = await getNotifications();
    setItems(data.notifications);
    setUnread(data.unread);
  }, []);

  useEffect(() => {
    load();
    const channel = supabaseBrowser
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Notification", filter: `userId=eq.${userId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [userId, load]);

  function openItem(n: NotificationItem) {
    markNotificationRead(n.id).then(() => load());
    if (n.taskPath) router.push(n.taskPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notificações</span>
          {unread > 0 && (
            <button
              onClick={() => markAllNotificationsRead().then(() => load())}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </p>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 border-b px-3 py-2 hover:bg-accent",
                !n.read && "bg-primary/5"
              )}
              onClick={() => openItem(n)}
            >
              <span className="text-sm">{n.message}</span>
              <span className="text-xs text-muted-foreground">{relativeTime(n.createdAt)}</span>
            </div>
          ))}
        </div>
        <div className="border-t p-1">
          <Link
            href="/settings/notifications"
            className="block rounded px-2 py-1.5 text-center text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Configurar notificações
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
