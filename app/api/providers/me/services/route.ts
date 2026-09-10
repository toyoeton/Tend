import { NextResponse } from "next/server";
import { Role, ServiceType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.nativeEnum(ServiceType),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().int().positive(),
  solPrice: z.number().positive().optional(),
  durationMins: z.number().int().min(30),
  isActive: z.boolean().default(true)
});

export async function POST(request: Request) {
  const auth = await requireRole(Role.PROVIDER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());
  const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.session.user.id } });
  if (!profile) return NextResponse.json({ error: "Create provider profile first" }, { status: 400 });

  const service = await prisma.service.create({
    data: { ...body, providerId: profile.id }
  });

  return NextResponse.json({ service }, { status: 201 });
}
