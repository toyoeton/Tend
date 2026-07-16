import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  role: z.nativeEnum(Role)
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = schema.parse(await request.json());
  const user = await prisma.user.findUnique({ where: { id: auth.session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role) return NextResponse.json({ error: "Role has already been selected" }, { status: 409 });

  await prisma.user.update({
    where: { id: user.id },
    data: { role: body.role }
  });

  return NextResponse.json({ ok: true });
}
