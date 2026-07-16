import { BookingStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/calendar";
import { sendEmail } from "@/lib/email";
import { type PaystackWebhookPayload, verifyPaystackSignature } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  if (payload.event !== "charge.success" || payload.data.status !== "success") {
    return NextResponse.json({ ok: true });
  }

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { paystackRef: payload.data.reference },
      include: {
        customer: true,
        service: true,
        provider: { include: { user: true } }
      }
    });
    if (!existing) throw new Error("Booking not found");
    if (existing.paymentStatus === PaymentStatus.SUCCESS) return existing;
    if (existing.price !== payload.data.amount) throw new Error("Payment amount mismatch");

    return tx.booking.update({
      where: { id: existing.id },
      data: { paymentStatus: PaymentStatus.SUCCESS, status: BookingStatus.CONFIRMED },
      include: {
        customer: true,
        service: true,
        provider: { include: { user: true } }
      }
    });
  });

  if (!booking.googleEventId) {
    const eventId = await createCalendarEvent({
      encryptedRefreshToken: booking.provider.googleRefreshToken,
      summary: `Tend: ${booking.service.name}`,
      description: `Booking with ${booking.customer.name}.`,
      start: booking.scheduledStart,
      end: booking.scheduledEnd
    });
    if (eventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: eventId } });
    }
  }

  await Promise.all([
    sendEmail({
      to: booking.customer.email,
      subject: "Your Tend booking is confirmed",
      text: `${booking.service.name} is confirmed for ${booking.scheduledStart.toISOString()}.`
    }),
    sendEmail({
      to: booking.provider.user.email,
      subject: "New Tend booking confirmed",
      text: `${booking.customer.name} booked ${booking.service.name}.`
    })
  ]);

  return NextResponse.json({ ok: true });
}
