import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getGoogleBusyBlocks, type BusyBlock } from "@/lib/calendar";

export type Slot = {
  start: string;
  end: string;
};

function parseTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function overlaps(start: Date, end: Date, blocks: BusyBlock[]): boolean {
  return blocks.some((block) => start < block.end && end > block.start);
}

export async function getAvailableSlots(input: {
  providerId: string;
  serviceId: string;
  date: string;
}): Promise<Slot[]> {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: input.providerId },
    include: {
      openHours: true,
      services: { where: { id: input.serviceId, isActive: true } }
    }
  });
  const service = provider?.services[0];
  if (!provider || !service || !provider.isActive) return [];

  const dateObject = new Date(`${input.date}T00:00:00`);
  const openHour = provider.openHours.find((hour) => hour.dayOfWeek === dateObject.getDay());
  if (!openHour || openHour.isClosed) return [];

  const dayStart = parseTime(input.date, openHour.openTime);
  const dayEnd = parseTime(input.date, openHour.closeTime);

  const bookings = await prisma.booking.findMany({
    where: {
      providerId: input.providerId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
      scheduledStart: { lt: dayEnd },
      scheduledEnd: { gt: dayStart }
    },
    select: { scheduledStart: true, scheduledEnd: true }
  });

  const googleBlocks = await getGoogleBusyBlocks({
    encryptedRefreshToken: provider.googleRefreshToken,
    timeMin: dayStart,
    timeMax: dayEnd
  });

  const busyBlocks: BusyBlock[] = [
    ...bookings.map((booking) => ({ start: booking.scheduledStart, end: booking.scheduledEnd })),
    ...googleBlocks
  ];

  const slots: Slot[] = [];
  for (
    let cursor = new Date(dayStart);
    cursor.getTime() + service.durationMins * 60_000 <= dayEnd.getTime();
    cursor = new Date(cursor.getTime() + 30 * 60_000)
  ) {
    const slotEnd = new Date(cursor.getTime() + service.durationMins * 60_000);
    if (!overlaps(cursor, slotEnd, busyBlocks) && cursor > new Date()) {
      slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
    }
  }

  return slots;
}

export function conflictingBookingWhere(input: {
  providerId: string;
  start: Date;
  end: Date;
  excludeBookingId?: string;
}): Prisma.BookingWhereInput {
  return {
    providerId: input.providerId,
    id: input.excludeBookingId ? { not: input.excludeBookingId } : undefined,
    status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
    scheduledStart: { lt: input.end },
    scheduledEnd: { gt: input.start }
  };
}
