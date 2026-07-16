import { Resend } from "resend";
import { optionalEnv } from "@/lib/env";

type EmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(input: EmailInput): Promise<void> {
  const apiKey = optionalEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.info(`[email skipped] ${input.subject} -> ${input.to}`);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "Tend <notifications@tend.local>",
    to: input.to,
    subject: input.subject,
    text: input.text
  });
}
