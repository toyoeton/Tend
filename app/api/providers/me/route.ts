import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  businessName: z.string().min(2),
  bio: z.string().max(800).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().min(3),
  isActive: z.boolean().default(true)
});

export async function POST(request: Request) {
  const auth = await requireRole(Role.PROVIDER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());

  const profile = await prisma.providerProfile.upsert({
    where: { userId: auth.session.user.id },
    create: {
      ...body,
      latitude: body.latitude ?? 6.5244,
      longitude: body.longitude ?? 3.3792,
      userId: auth.session.user.id
    },
    update: body
  });

  return NextResponse.json({ profile });
}
