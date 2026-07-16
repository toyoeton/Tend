import { BookingStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { conflictingBookingWhere } from "@/lib/availability";
import { patchCalendarEvent } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({ scheduledStart: z.string().datetime() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Role.CUSTOMER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: true, customer: true, provider: { include: { user: true } } }
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.customerId !== auth.session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING_PAYMENT) {
    return NextResponse.json({ error: "Booking cannot be rescheduled" }, { status: 400 });
  }

  const scheduledStart = new Date(body.scheduledStart);
  const scheduledEnd = new Date(scheduledStart.getTime() + booking.service.durationMins * 60_000);

  const updated = await prisma.$transaction(async (tx) => {
    const conflict = await tx.booking.findFirst({
      where: conflictingBookingWhere({
        providerId: booking.providerId,
        start: scheduledStart,
        end: scheduledEnd,
        excludeBookingId: booking.id
      })
    });
    if (conflict) throw new Error("Slot is no longer available");
    return tx.booking.update({
      where: { id: booking.id },
      data: { scheduledStart, scheduledEnd, status: BookingStatus.RESCHEDULED },
      include: { service: true, customer: true, provider: { include: { user: true } } }
    });
  });

  await patchCalendarEvent({
    encryptedRefreshToken: booking.provider.googleRefreshToken,
    eventId: booking.googleEventId,
    start: scheduledStart,
    end: scheduledEnd
  });

  await sendEmail({
    to: updated.customer.email,
    subject: "Your Tend booking was rescheduled",
    text: `${updated.service.name} is now scheduled for ${updated.scheduledStart.toISOString()}.`
  });

  return NextResponse.json({ booking: updated });
}
