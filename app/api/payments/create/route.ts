import { PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSolanaPaymentUrl, generatePaymentReference } from "@/lib/solana-pay";
import { resolveSolPrice } from "@/lib/solana-price";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  bookingId: z.string().min(1)
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: { service: true }
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const reference = generatePaymentReference();
  const amount = await resolveSolPrice(booking.price, booking.solPrice);
  const message = `Booking payment for ${booking.service.name}/${booking.scheduledStart.toISOString()}`;
  const url = createSolanaPaymentUrl({ amount, reference, message });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      paymentReference: reference.toBase58(),
      paymentStatus: PaymentStatus.PENDING
    }
  });

  return NextResponse.json({
    url: url.toString(),
    reference: reference.toBase58()
  });
}
