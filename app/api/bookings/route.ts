import crypto from "crypto";
import { NextResponse } from "next/server";
import { BookingStatus, PaymentStatus, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { conflictingBookingWhere } from "@/lib/availability";
import { env } from "@/lib/env";
import { initializePaystackTransaction } from "@/lib/paystack";
import { sendEmail } from "@/lib/email";
import { resolveSolPrice } from "@/lib/solana-price";

export const dynamic = "force-dynamic";

const schema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  scheduledStart: z.string().datetime(),
  customerLocation: z.string().optional()
});

export async function POST(request: Request) {
  const auth = await requireRole(Role.CUSTOMER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());

  const service = await prisma.service.findFirst({
    where: { id: body.serviceId, providerId: body.providerId, isActive: true, provider: { isActive: true } },
    include: { provider: { include: { user: true } } }
  });
  if (!service) return NextResponse.json({ error: "Service is unavailable" }, { status: 404 });

  const scheduledStart = new Date(body.scheduledStart);
  const scheduledEnd = new Date(scheduledStart.getTime() + service.durationMins * 60_000);
  if (scheduledStart <= new Date()) {
    return NextResponse.json({ error: "Choose a future slot" }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id: auth.session.user.id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const reference = `tend_${crypto.randomUUID().replaceAll("-", "")}`;
  const solPrice = await resolveSolPrice(service.price);

  const booking = await prisma.$transaction(async (tx) => {
    const conflict = await tx.booking.findFirst({
      where: conflictingBookingWhere({ providerId: body.providerId, start: scheduledStart, end: scheduledEnd })
    });
    if (conflict) throw new Error("Slot is no longer available");

    return tx.booking.create({
      data: {
        customerId: customer.id,
        providerId: body.providerId,
        serviceId: service.id,
        scheduledStart,
        scheduledEnd,
        customerLocation: body.customerLocation,
        price: service.price,
        solPrice: solPrice.toNumber(),
        paystackRef: reference,
        status: BookingStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING
      }
    });
  });

  const authorizationUrl = await initializePaystackTransaction({
    email: customer.email,
    amount: service.price,
    reference,
    callbackUrl: `${env("NEXTAUTH_URL")}/dashboard/customer`
  });

  await sendEmail({
    to: customer.email,
    subject: "Your Tend booking is pending payment",
    text: `Complete payment to confirm ${service.name} with ${service.provider.businessName}.`
  });

  return NextResponse.json({ booking, authorizationUrl }, { status: 201 });
}
