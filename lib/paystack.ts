import crypto from "crypto";
import { env } from "@/lib/env";

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackRefundResponse = {
  status: boolean;
  message: string;
};

export type PaystackWebhookPayload = {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    paid_at?: string;
    customer?: { email?: string };
  };
};

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });
  const payload = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(`Paystack request failed: ${response.status}`);
  }
  return payload;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
}): Promise<string> {
  const payload = await paystackRequest<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      reference: input.reference,
      callback_url: input.callbackUrl
    })
  });
  if (!payload.status || !payload.data?.authorization_url) {
    throw new Error(payload.message || "Unable to initialize Paystack transaction");
  }
  return payload.data.authorization_url;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", env("PAYSTACK_SECRET_KEY")).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function refundPaystack(reference: string): Promise<void> {
  const payload = await paystackRequest<PaystackRefundResponse>("/refund", {
    method: "POST",
    body: JSON.stringify({ transaction: reference })
  });
  if (!payload.status) {
    throw new Error(payload.message || "Unable to refund Paystack transaction");
  }
}
