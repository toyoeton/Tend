import { BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST() {
  const now = new Date();
  await prisma.booking.updateMany({
    where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED] }, scheduledEnd: { lt: now } },
    data: { status: BookingStatus.COMPLETED }
  });

  const windows = [24, 1].map((hours) => ({
    hours,
    from: new Date(now.getTime() + hours * 60 * 60_000 - 10 * 60_000),
    to: new Date(now.getTime() + hours * 60 * 60_000 + 10 * 60_000)
  }));

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED] },
      OR: windows.map((window) => ({ scheduledStart: { gte: window.from, lte: window.to } }))
    },
    include: { customer: true, service: true, provider: true }
  });

  for (const booking of bookings) {
    const hours = windows.find((window) => booking.scheduledStart >= window.from && booking.scheduledStart <= window.to)?.hours;
    await sendEmail({
      to: booking.customer.email,
      subject: `Tend reminder: ${hours ?? ""} hour booking reminder`,
      text: `${booking.service.name} with ${booking.provider.businessName} starts at ${booking.scheduledStart.toISOString()}.`
    });
  }

  return NextResponse.json({ reminded: bookings.length });
}
