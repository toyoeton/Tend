import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(Role.PROVIDER);
  if ("response" in auth) return auth.response;
  const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.session.user.id } });
  if (!profile) return NextResponse.json({ bookings: [] });
  const bookings = await prisma.booking.findMany({
    where: { providerId: profile.id },
    include: { service: true, customer: { select: { name: true, email: true, phone: true } }, review: true },
    orderBy: { scheduledStart: "desc" }
  });
  return NextResponse.json({ bookings });
}
