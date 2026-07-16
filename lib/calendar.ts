import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import { decryptSecret } from "@/lib/crypto";

export type BusyBlock = {
  start: Date;
  end: Date;
};

function calendarClient(encryptedRefreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL
  );
  oauth2.setCredentials({ refresh_token: decryptSecret(encryptedRefreshToken) });
  return google.calendar({ version: "v3", auth: oauth2 });
}

export async function getGoogleBusyBlocks(input: {
  encryptedRefreshToken?: string | null;
  timeMin: Date;
  timeMax: Date;
}): Promise<BusyBlock[]> {
  if (!input.encryptedRefreshToken) return [];
  const calendar = calendarClient(input.encryptedRefreshToken);
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.timeMin.toISOString(),
      timeMax: input.timeMax.toISOString(),
      items: [{ id: "primary" }]
    }
  });
  const busy = response.data.calendars?.primary?.busy ?? [];
  return busy.flatMap((block) =>
    block.start && block.end ? [{ start: new Date(block.start), end: new Date(block.end) }] : []
  );
}

export async function createCalendarEvent(input: {
  encryptedRefreshToken?: string | null;
  summary: string;
  description: string;
  start: Date;
  end: Date;
}): Promise<string | null> {
  if (!input.encryptedRefreshToken) return null;
  const calendar = calendarClient(input.encryptedRefreshToken);
  const event: calendar_v3.Schema$Event = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.start.toISOString() },
    end: { dateTime: input.end.toISOString() }
  };
  const response = await calendar.events.insert({ calendarId: "primary", requestBody: event });
  return response.data.id ?? null;
}

export async function patchCalendarEvent(input: {
  encryptedRefreshToken?: string | null;
  eventId?: string | null;
  start: Date;
  end: Date;
}): Promise<void> {
  if (!input.encryptedRefreshToken || !input.eventId) return;
  const calendar = calendarClient(input.encryptedRefreshToken);
  await calendar.events.patch({
    calendarId: "primary",
    eventId: input.eventId,
    requestBody: {
      start: { dateTime: input.start.toISOString() },
      end: { dateTime: input.end.toISOString() }
    }
  });
}
