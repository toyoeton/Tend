import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseServiceType } from "@/lib/service-types";

export const dynamic = "force-dynamic";

type ProviderSearchRow = {
  id: string;
  businessName: string;
  bio: string | null;
  latitude: number;
  longitude: number;
  address: string;
  avgRating: number;
  ratingCount: number;
  distanceKm: number | null;
  minPrice: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceType = parseServiceType(searchParams.get("serviceType"));
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lng = Number.parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = Number.parseFloat(searchParams.get("radiusKm") ?? "25");
  const sort = searchParams.get("sort") ?? "rating";
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  const rows = await prisma.$queryRaw<ProviderSearchRow[]>`
    SELECT
      p.id,
      p."businessName",
      p.bio,
      p.latitude,
      p.longitude,
      p.address,
      p."avgRating",
      p."ratingCount",
      ${hasLocation ? Prisma.sql`(6371 * acos(cos(radians(${lat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.latitude))))` : Prisma.sql`NULL`} AS "distanceKm",
      MIN(s.price) AS "minPrice"
    FROM "ProviderProfile" p
    JOIN "Service" s ON s."providerId" = p.id AND s."isActive" = true
    WHERE p."isActive" = true
      ${serviceType ? Prisma.sql`AND s.type = ${serviceType}::"ServiceType"` : Prisma.empty}
    GROUP BY p.id
    ${hasLocation ? Prisma.sql`HAVING (6371 * acos(cos(radians(${lat})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(p.latitude)))) <= ${radiusKm}` : Prisma.empty}
    ORDER BY
      ${sort === "distance" && hasLocation ? Prisma.sql`"distanceKm" ASC` : Prisma.empty}
      ${sort === "price" ? Prisma.sql`"minPrice" ASC` : Prisma.empty}
      ${sort !== "distance" && sort !== "price" ? Prisma.sql`p."avgRating" DESC, p."ratingCount" DESC` : Prisma.empty}
    LIMIT 50
  `;

  return NextResponse.json({ providers: rows });
}
