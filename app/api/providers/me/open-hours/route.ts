import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const hourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean().default(false)
});

const schema = z.object({ hours: z.array(hourSchema).length(7) });

export async function POST(request: Request) {
  const auth = await requireRole(Role.PROVIDER);
  if ("response" in auth) return auth.response;
  const body = schema.parse(await request.json());
  const profile = await prisma.providerProfile.findUnique({ where: { userId: auth.session.user.id } });
  if (!profile) return NextResponse.json({ error: "Create provider profile first" }, { status: 400 });

  await prisma.$transaction(
    body.hours.map((hour) =>
      prisma.openHour.upsert({
        where: { providerId_dayOfWeek: { providerId: profile.id, dayOfWeek: hour.dayOfWeek } },
        create: { ...hour, providerId: profile.id },
        update: hour
      })
    )
  );

  return NextResponse.json({ ok: true });
}
