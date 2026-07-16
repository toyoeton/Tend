import { BookingStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(800).optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Role.CUSTOMER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.customerId !== auth.session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== BookingStatus.COMPLETED || booking.scheduledEnd > new Date()) {
    return NextResponse.json({ error: "Only completed bookings can be reviewed" }, { status: 400 });
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { bookingId: booking.id, customerId: auth.session.user.id, rating: body.rating, comment: body.comment }
    });
    const aggregate = await tx.review.aggregate({
      where: { booking: { providerId: booking.providerId } },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await tx.providerProfile.update({
      where: { id: booking.providerId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        ratingCount: aggregate._count.rating
      }
    });
    return created;
  });

  return NextResponse.json({ review }, { status: 201 });
}
