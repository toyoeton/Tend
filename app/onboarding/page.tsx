import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthButtons } from "@/components/auth-buttons";
import { RoleForm } from "@/components/role-form";
import { authOptions } from "@/lib/auth";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <section className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Sign in to continue</h1>
        <p className="mt-3 text-muted">Tend uses Google OAuth only.</p>
        <div className="mt-6">
          <AuthButtons />
        </div>
      </section>
    );
  }
  if (session.user.role === "CUSTOMER") redirect("/providers");
  if (session.user.role === "PROVIDER") redirect("/dashboard/provider");

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Choose your Tend role</h1>
      <p className="mt-3 text-muted">A Google account can hold one role for the MVP.</p>
      <RoleForm />
    </section>
  );
}
