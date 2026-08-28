import { FindReferenceError, ValidateTransferError } from "@solana/pay";
import { PaymentStatus } from "@prisma/client";
import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { bookingPriceInSol, findAndValidateSolanaPayment } from "@/lib/solana-pay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().min(1)
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = schema.safeParse({ reference: searchParams.get("reference") });
  if (!body.success) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { paymentReference: body.data.reference }
  });

  if (!booking) {
    return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
  }

  if (booking.paymentStatus === PaymentStatus.CONFIRMED) {
    return NextResponse.json({ status: "confirmed" });
  }

  try {
    const reference = new PublicKey(body.data.reference);
    const signature = await findAndValidateSolanaPayment({
      amount: bookingPriceInSol(booking.price),
      reference
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: PaymentStatus.CONFIRMED }
    });

    return NextResponse.json({ status: "confirmed", signature });
  } catch (error: unknown) {
    if (error instanceof FindReferenceError) {
      return NextResponse.json({ status: "pending" });
    }

    if (error instanceof ValidateTransferError) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: PaymentStatus.FAILED }
      });
      return NextResponse.json(
        { status: "failed", error: "Transaction was found but did not match the expected recipient, amount, or reference" },
        { status: 422 }
      );
    }

    return NextResponse.json({ status: "failed", error: "Unable to verify Solana payment" }, { status: 500 });
  }
}
