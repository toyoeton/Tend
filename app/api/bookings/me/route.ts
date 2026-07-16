import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(Role.CUSTOMER);
  if ("response" in auth) return auth.response;
  const bookings = await prisma.booking.findMany({
    where: { customerId: auth.session.user.id },
    include: {
      service: true,
      provider: { select: { businessName: true, address: true } },
      review: true
    },
    orderBy: { scheduledStart: "desc" }
  });
  return NextResponse.json({ bookings });
}
