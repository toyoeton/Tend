import Link from "next/link";
import { ServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatKobo } from "@/lib/money";
import { parseServiceType } from "@/lib/service-types";

export const dynamic = "force-dynamic";

export default async function ProvidersPage({ searchParams }: { searchParams: { serviceType?: string } }) {
  const serviceType = parseServiceType(searchParams.serviceType);

  const providers = await prisma.providerProfile.findMany({
    where: {
      isActive: true,
      ...(serviceType && {
        services: { some: { isActive: true, type: serviceType } },
      }),
    },
    include: {
      services: {
        where: {
          isActive: true,
          ...(serviceType && { type: serviceType }),
        },
        orderBy: { price: "asc" },
        take: 3,
      },
    },
    orderBy: { avgRating: "desc" },
    take: 30,
  });

  

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">Browse providers</h1>
          <p className="mt-2 text-muted">Filter by service type and open a provider to choose a time slot.</p>
        </div>
        <form className="flex gap-2">
          <select name="serviceType" defaultValue={serviceType ?? ""} className="border border-line bg-white px-3 py-2">
            <option value="">All services</option>
            {Object.values(ServiceType).map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase()}
              </option>
            ))}
          </select>
          <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white">Apply</button>
        </form>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Link key={provider.id} href={`/providers/${provider.id}`} className="border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{provider.businessName}</h2>
                <p className="mt-1 text-sm text-muted">{provider.address}</p>
              </div>
              <span className="rounded border border-line px-2 py-1 text-sm">{provider.avgRating.toFixed(1)}</span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted">{provider.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider.services.map((service) => (
                <span key={service.id} className="rounded border border-line px-2 py-1 text-sm">
                  {service.name} · {formatKobo(service.price)}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
