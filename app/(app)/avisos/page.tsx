import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getActiveWorkspace, canManageWorkspace } from "@/lib/workspace";
import { getAnnouncements } from "@/lib/actions/announcement";
import { AnnouncementBoard } from "@/components/announcements/announcement-board";

export const metadata: Metadata = {
  title: "Avisos · Kaizen",
};

export default async function AvisosPage() {
  const active = await getActiveWorkspace();
  if (!active) redirect("/onboarding");

  const announcements = await getAnnouncements();

  return (
    <AnnouncementBoard announcements={announcements} canManage={canManageWorkspace(active.role)} />
  );
}
