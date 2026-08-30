import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/booking-widget";
import { formatKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { displaySolPrice, getSolNgnRate } from "@/lib/solana-price";

export const dynamic = "force-dynamic";

export default async function ProviderDetailPage({ params }: { params: { id: string } }) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: params.id },
    include: {
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      openHours: { orderBy: { dayOfWeek: "asc" } },
      bookings: {
        where: { review: { isNot: null } },
        include: { review: { include: { customer: { select: { name: true } } } } },
        take: 6,
        orderBy: { updatedAt: "desc" }
      }
    }
  });
  if (!provider) notFound();
  const solNgnRate = await getSolNgnRate();

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="border-b border-line pb-5">
          <p className="text-sm font-semibold text-accent">{provider.isActive ? "Accepting bookings" : "Offline"}</p>
          <h1 className="mt-2 text-3xl font-semibold">{provider.businessName}</h1>
          <p className="mt-2 text-muted">{provider.address}</p>
          <p className="mt-4 max-w-2xl leading-7 text-muted">{provider.bio}</p>
          <p className="mt-3 text-sm">
            Rating {provider.avgRating.toFixed(1)} from {provider.ratingCount} reviews
          </p>
        </div>
        <div className="mt-6">
          <h2 className="font-semibold">Services</h2>
          <div className="mt-3 grid gap-3">
            {provider.services.map((service) => (
              <div key={service.id} className="grid gap-2 border border-line bg-white p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted">{service.description ?? service.type.toLowerCase()}</p>
                </div>
                <p className="font-semibold">
                  {formatKobo(service.price)}
                  {displaySolPrice(service.price, service.solPrice, solNgnRate) ? (
                    <span className="block text-sm text-accent">{displaySolPrice(service.price, service.solPrice, solNgnRate)}</span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <h2 className="font-semibold">Reviews</h2>
          <div className="mt-3 grid gap-3">
            {provider.bookings.map((booking) =>
              booking.review ? (
                <div key={booking.review.id} className="border border-line bg-white p-4">
                  <p className="font-medium">{booking.review.rating}/5 · {booking.review.customer.name}</p>
                  <p className="mt-2 text-sm text-muted">{booking.review.comment ?? "No comment left."}</p>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
      <BookingWidget providerId={provider.id} services={provider.services} />
    </section>
  );
}
