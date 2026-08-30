import { prisma } from "@/lib/prisma";
import { SolanaPayCheckout } from "@/components/SolanaPayCheckout";

export const dynamic = "force-dynamic";

export default async function SolanaPayDemoPage({
  params
}: {
  params: { bookingId: string };
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: { id: true }
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Pay for your booking</h1>
      <div className="mt-6">
        {booking ? (
          <SolanaPayCheckout bookingId={booking.id} />
        ) : (
          <p className="border border-line bg-white p-5 text-sm text-muted">Booking not found.</p>
        )}
      </div>
    </div>
  );
}
