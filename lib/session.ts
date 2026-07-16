import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireRole(role: Role) {
  const result = await requireUser();
  if ("response" in result) return result;
  if (result.session.user.role !== role) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return result;
}
