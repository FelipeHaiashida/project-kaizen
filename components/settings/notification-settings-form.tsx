"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  updateNotificationSettings,
  type NotificationSettingsData,
} from "@/lib/actions/notification";
import { Button } from "@/components/ui/button";

const OPTIONS: { key: keyof NotificationSettingsData; label: string; desc: string }[] = [
  { key: "taskAssigned", label: "Tarefa atribuída", desc: "Quando uma tarefa é atribuída a você" },
  { key: "mentioned", label: "Menções", desc: "Quando alguém menciona você em um comentário" },
  { key: "dueSoon", label: "Vencimento próximo", desc: "Quando uma tarefa sua vence em breve" },
  {
    key: "statusChanged",
    label: "Mudança de status",
    desc: "Quando o status de uma tarefa que você participa muda",
  },
];

export function NotificationSettingsForm({ initial }: { initial: NotificationSettingsData }) {
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof NotificationSettingsData) {
    setValues((v) => ({ ...v, [key]: !v[key] }));
  }

  function save() {
    startTransition(async () => {
      const r = await updateNotificationSettings(values);
      if (r.error) toast.error(r.error);
      else toast.success(r.success ?? "Salvo");
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y">
        {OPTIONS.map((o) => (
          <li key={o.key} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values[o.key]}
              aria-label={o.label}
              onClick={() => toggle(o.key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                values[o.key] ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                  values[o.key] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
      <Button onClick={save} disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar preferências"}
      </Button>
    </div>
  );
}
