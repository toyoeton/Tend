"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerBookingActions({ bookingId, canReview }: { bookingId: string; canReview: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function cancelBooking() {
    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Cancelled by customer" })
    });
    setMessage(response.ok ? "Cancelled" : "Could not cancel");
    router.refresh();
  }

  async function reschedule(formData: FormData) {
    const value = String(formData.get("scheduledStart"));
    if (!value) return;
    const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledStart: new Date(value).toISOString() })
    });
    setMessage(response.ok ? "Rescheduled" : "Could not reschedule");
    router.refresh();
  }

  async function review(formData: FormData) {
    const response = await fetch(`/api/bookings/${bookingId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: Number(formData.get("rating")),
        comment: String(formData.get("comment") ?? "")
      })
    });
    setMessage(response.ok ? "Review saved" : "Could not save review");
    router.refresh();
  }

  return (
    <div className="grid gap-2 text-sm">
      <button onClick={() => void cancelBooking()} className="rounded border border-line px-3 py-2 font-semibold">
        Cancel
      </button>
      <form action={(data) => void reschedule(data)} className="grid gap-2">
        <input name="scheduledStart" type="datetime-local" className="border border-line px-2 py-2" />
        <button className="rounded border border-line px-3 py-2 font-semibold">Reschedule</button>
      </form>
      {canReview ? (
        <form action={(data) => void review(data)} className="grid gap-2">
          <select name="rating" className="border border-line px-2 py-2" defaultValue="5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating}/5
              </option>
            ))}
          </select>
          <input name="comment" placeholder="Review comment" className="border border-line px-2 py-2" />
          <button className="rounded bg-accent px-3 py-2 font-semibold text-white">Review</button>
        </form>
      ) : null}
      {message ? <p className="text-accent">{message}</p> : null}
    </div>
  );
}
