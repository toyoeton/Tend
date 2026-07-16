import { NextResponse } from "next/server";
import { Role, ServiceType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.nativeEnum(ServiceType).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().int().positive().optional(),
  durationMins: z.number().int().min(30).optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Role.PROVIDER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());
  const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.session.user.id } });
  if (!profile) return NextResponse.json({ error: "Create provider profile first" }, { status: 400 });

  const existing = await prisma.service.findFirst({
    where: { id: params.id, providerId: profile.id }
  });
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const service = await prisma.service.update({ where: { id: params.id }, data: body });

  return NextResponse.json({ service });
}
