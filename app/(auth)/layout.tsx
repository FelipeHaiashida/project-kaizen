import Link from "next/link";

import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[380px] flex-col items-center gap-7">
        <Link href="/" aria-label="Kaizen">
          <Logo markSize={34} textSize={22} />
        </Link>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
