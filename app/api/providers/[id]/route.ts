import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, image: true } },
      openHours: { orderBy: { dayOfWeek: "asc" } },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      bookings: {
        where: { review: { isNot: null } },
        select: {
          review: {
            select: {
              rating: true,
              comment: true,
              createdAt: true,
              customer: { select: { name: true, image: true } }
            }
          }
        },
        take: 10,
        orderBy: { updatedAt: "desc" }
      }
    }
  });
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  return NextResponse.json({ provider });
}
