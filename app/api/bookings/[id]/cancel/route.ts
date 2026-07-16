import { BookingStatus, PaymentStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { cancellationWindowHours } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { refundPaystack } from "@/lib/paystack";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({ reason: z.string().optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { customer: true, provider: { include: { user: true } }, service: true }
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const isOwner = booking.customerId === auth.session.user.id;
  const providerProfile = auth.session.user.role === Role.PROVIDER
    ? await prisma.providerProfile.findUnique({ where: { userId: auth.session.user.id } })
    : null;
  const isProvider = providerProfile?.id === booking.providerId;
  if (!isOwner && !isProvider) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const deadline = new Date(booking.scheduledStart.getTime() - cancellationWindowHours() * 60 * 60_000);
  const refundable = new Date() <= deadline && booking.paymentStatus === PaymentStatus.SUCCESS && Boolean(booking.paystackRef);

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: refundable ? PaymentStatus.REFUNDED : booking.paymentStatus,
        cancelReason: `${body.reason ?? "No reason provided"} | ${refundable ? "Full refund within policy" : "No refund under cancellation policy"}`
      }
    });
  });

  if (refundable && booking.paystackRef) {
    await refundPaystack(booking.paystackRef);
  }

  await sendEmail({
    to: booking.customer.email,
    subject: "Your Tend booking was cancelled",
    text: `${booking.service.name} was cancelled. ${refundable ? "A refund was requested." : "Cancellation policy did not allow a refund."}`
  });

  return NextResponse.json({ ok: true, refundable });
}
