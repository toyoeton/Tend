import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Providers } from "@/components/providers";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tend",
  description: "Book trusted local services in advance."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <Providers>
          <header className="border-b border-line bg-paper">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-normal">
                Tend
              </Link>
              <nav className="flex items-center gap-4 text-sm text-muted">
                <Link href="/providers">Browse</Link>
                {session?.user.role === "PROVIDER" ? <Link href="/dashboard/provider">Provider</Link> : null}
                {session?.user.role === "CUSTOMER" ? <Link href="/dashboard/customer">Bookings</Link> : null}
                {session?.user.role ? null : <Link href="/onboarding">Role</Link>}
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
