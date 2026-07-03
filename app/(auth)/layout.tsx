import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Link href="/" className="mb-6 text-center">
        <span className="text-2xl font-bold tracking-tight">Kaizen</span>
        <span className="ml-2 text-sm text-primary">改善</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
