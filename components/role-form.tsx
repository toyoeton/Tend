"use client";

import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RoleForm() {
  const router = useRouter();
  const [pending, setPending] = useState<Role | null>(null);

  async function choose(role: Role) {
    setPending(role);
    const response = await fetch("/api/onboarding/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    setPending(null);
    if (response.ok) {
      router.push(role === "PROVIDER" ? "/dashboard/provider" : "/providers");
      router.refresh();
    }
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <button onClick={() => void choose("CUSTOMER")} className="border border-line bg-white p-5 text-left hover:border-accent">
        <span className="block font-semibold">Customer</span>
        <span className="mt-2 block text-sm text-muted">Browse providers, book slots, pay, reschedule, and review.</span>
        <span className="mt-4 block text-sm text-accent">{pending === "CUSTOMER" ? "Saving..." : "Choose customer"}</span>
      </button>
      <button onClick={() => void choose("PROVIDER")} className="border border-line bg-white p-5 text-left hover:border-accent">
        <span className="block font-semibold">Provider</span>
        <span className="mt-2 block text-sm text-muted">Manage services, hours, calendar availability, and bookings.</span>
        <span className="mt-4 block text-sm text-accent">{pending === "PROVIDER" ? "Saving..." : "Choose provider"}</span>
      </button>
    </div>
  );
}
