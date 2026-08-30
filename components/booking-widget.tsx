"use client";

import type { Service } from "@prisma/client";
import { useState } from "react";
import { formatKobo } from "@/lib/money";
import { SolanaPayCheckout } from "@/components/SolanaPayCheckout";

type Slot = { start: string; end: string };

export function BookingWidget({ providerId, services }: { providerId: string; services: Service[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [solanaBookingId, setSolanaBookingId] = useState<string | null>(null);

  async function loadSlots() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/providers/${providerId}/availability?date=${date}&serviceId=${serviceId}`);
    const payload = (await response.json()) as { slots?: Slot[]; error?: string };
    setSlots(payload.slots ?? []);
    setSelectedSlot("");
    setMessage(payload.error ?? "");
    setLoading(false);
  }

  async function createBooking() {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, serviceId, scheduledStart: selectedSlot })
    });
    const payload = (await response.json()) as { booking?: { id: string }; authorizationUrl?: string; error?: string };
    return { response, payload };
  }

  async function book() {
    if (!selectedSlot) return;
    setLoading(true);
    const { response, payload } = await createBooking();
    setLoading(false);
    if (payload.authorizationUrl) {
      window.location.href = payload.authorizationUrl;
      return;
    }
    setMessage(payload.error ?? "Unable to start checkout");
  }

  async function bookWithSolana() {
    if (!selectedSlot) return;
    setLoading(true);
    setMessage("");
    const { response, payload } = await createBooking();
    setLoading(false);
    if (response.ok && payload.booking?.id) {
      setSolanaBookingId(payload.booking.id);
      return;
    }
    setMessage(payload.error ?? "Unable to start checkout");
  }

  const selectedService = services.find((service) => service.id === serviceId);

  return (
    <div className="border border-line bg-white p-5">
      <h2 className="font-semibold">Book a slot</h2>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Service</span>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="border border-line px-3 py-2">
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {formatKobo(service.price)} · {service.durationMins}m
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border border-line px-3 py-2" />
        </label>
        <button onClick={() => void loadSlots()} className="rounded border border-line px-4 py-2 text-sm font-semibold">
          {loading ? "Checking..." : "Check availability"}
        </button>
      </div>
      {loading ? (
        <div className="mt-4 grid gap-2">
          <div className="skeleton h-9 rounded" />
          <div className="skeleton h-9 rounded" />
        </div>
      ) : null}
      {slots.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.start}
              onClick={() => setSelectedSlot(slot.start)}
              className={`rounded border px-3 py-2 text-sm ${selectedSlot === slot.start ? "border-accent bg-accent text-white" : "border-line"}`}
            >
              {new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => void book()}
          disabled={!selectedSlot || !selectedService || loading}
          className="w-full rounded bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Continue to Paystack
        </button>
        <button
          onClick={() => void bookWithSolana()}
          disabled={!selectedSlot || !selectedService || loading}
          className="w-full rounded border border-accent px-4 py-2 text-sm font-semibold text-accent disabled:opacity-50"
        >
          Pay with Solana
        </button>
      </div>
      {solanaBookingId ? (
        <div className="mt-4">
          <SolanaPayCheckout bookingId={solanaBookingId} />
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
