"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

type CreatePaymentResponse = {
  url: string;
  reference: string;
};

type PaymentStatusResponse =
  | { status: "pending" }
  | { status: "confirmed"; signature?: string }
  | { status: "failed"; error: string };

export function SolanaPayCheckout({ bookingId }: { bookingId: string }) {
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const [status, setStatus] = useState<"creating" | "pending" | "confirmed" | "failed">("creating");
  const [message, setMessage] = useState("Preparing Solana Pay request...");
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    async function createPayment() {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId })
      });

      if (!response.ok) {
        setStatus("failed");
        setMessage("Could not create Solana Pay request.");
        return;
      }

      const payload = (await response.json()) as CreatePaymentResponse;
      setPayment(payload);
      setStatus("pending");
      setMessage("Waiting for payment...");
    }

    void createPayment();
  }, [bookingId]);

  useEffect(() => {
    if (!payment?.reference || status !== "pending") return;

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/payments/status?reference=${encodeURIComponent(payment.reference)}`);
      const payload = (await response.json()) as PaymentStatusResponse;

      if (payload.status === "confirmed") {
        setStatus("confirmed");
        setMessage(payload.signature ? `Payment confirmed: ${payload.signature}` : "Payment confirmed.");
        window.clearInterval(interval);
      }

      if (payload.status === "failed") {
        setStatus("failed");
        setMessage(payload.error);
        window.clearInterval(interval);
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [payment?.reference, status]);

  return (
    <section className="border border-line bg-white p-5">
      <h2 className="font-semibold">Solana Pay</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {payment ? (
        <div className="mt-4 grid gap-4">
          <div className="w-fit border border-line bg-paper p-3">
            <QRCodeSVG value={payment.url} size={220} includeMargin />
          </div>
          <a href={payment.url} className="text-sm font-semibold text-accent">
            Open in wallet
          </a>
          <p className="break-all text-xs text-muted">Reference: {payment.reference}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          <div className="skeleton h-9 rounded" />
          <div className="skeleton h-9 rounded" />
        </div>
      )}
      {status === "confirmed" ? <p className="mt-4 text-sm font-semibold text-accent">Payment successful</p> : null}
    </section>
  );
}
