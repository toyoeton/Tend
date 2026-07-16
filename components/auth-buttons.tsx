"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <div className="skeleton h-10 w-32 rounded" />;
  }
  if (!session) {
    return (
      <button
        onClick={() => void signIn("google", { callbackUrl: "/onboarding" })}
        className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        Sign in with Google
      </button>
    );
  }
  return (
    <button onClick={() => void signOut()} className="rounded border border-line px-4 py-2 text-sm font-semibold">
      Sign out
    </button>
  );
}
