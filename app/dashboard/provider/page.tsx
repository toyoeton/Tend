import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { OpenHoursForm } from "@/components/open-hours-form";
import { ProviderProfileForm } from "@/components/provider-profile-form";
import { authOptions } from "@/lib/auth";
import { formatKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/onboarding");
  if (session.user.role !== Role.PROVIDER) redirect("/providers");

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      services: true,
      bookings: { include: { service: true, customer: true }, orderBy: { scheduledStart: "desc" }, take: 20 }
    }
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Provider dashboard</h1>
      <p className="mt-2 text-muted">Manage profile, services, and incoming bookings.</p>
      <div className="mt-6">
        <ProviderProfileForm />
        <OpenHoursForm />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-semibold">Services</h2>
          <div className="mt-3 grid gap-3">
            {profile?.services.map((service) => (
              <div key={service.id} className="border border-line bg-white p-4">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted">{service.type.toLowerCase()} · {formatKobo(service.price)} · {service.durationMins}m</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold">Bookings</h2>
          <div className="mt-3 grid gap-3">
            {profile?.bookings.map((booking) => (
              <div key={booking.id} className="border border-line bg-white p-4">
                <p className="font-medium">{booking.service.name}</p>
                <p className="text-sm text-muted">{booking.customer.name} · {booking.status} · {booking.scheduledStart.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
