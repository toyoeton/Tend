import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { CustomerBookingActions } from "@/components/customer-booking-actions";
import { authOptions } from "@/lib/auth";
import { formatKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/onboarding");
  if (session.user.role !== Role.CUSTOMER) redirect("/dashboard/provider");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    include: { provider: true, service: true, review: true },
    orderBy: { scheduledStart: "desc" }
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold">My bookings</h1>
      <div className="mt-6 grid gap-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="grid gap-3 border border-line bg-white p-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-medium">{booking.service.name}</p>
              <p className="mt-1 text-sm text-muted">
                {booking.provider.businessName} · {booking.scheduledStart.toLocaleString()} · {booking.status}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-semibold">{formatKobo(booking.price)}</p>
              <p className="text-sm text-muted">{booking.paymentStatus}</p>
            </div>
            <div className="md:col-span-2">
              <CustomerBookingActions
                bookingId={booking.id}
                canReview={booking.status === "COMPLETED" && !booking.review}
              />
            </div>
          </div>
        ))}
        {bookings.length === 0 ? <p className="text-muted">No bookings yet.</p> : null}
      </div>
    </section>
  );
}
