"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function OpenHoursForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const hours = days.map((_, dayOfWeek) => ({
      dayOfWeek,
      openTime: String(formData.get(`open-${dayOfWeek}`) ?? "09:00"),
      closeTime: String(formData.get(`close-${dayOfWeek}`) ?? "18:00"),
      isClosed: formData.get(`closed-${dayOfWeek}`) === "on"
    }));
    const response = await fetch("/api/providers/me/open-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours })
    });
    setMessage(response.ok ? "Hours saved" : "Could not save hours");
    router.refresh();
  }

  return (
    <form action={(data) => void submit(data)} className="mt-4 border border-line bg-white p-5">
      <h2 className="font-semibold">Weekly hours</h2>
      <div className="mt-4 grid gap-3">
        {days.map((day, index) => (
          <div key={day} className="grid gap-2 border-b border-line pb-3 last:border-0 sm:grid-cols-[1fr_120px_120px_90px]">
            <span className="text-sm font-medium">{day}</span>
            <input name={`open-${index}`} type="time" defaultValue="09:00" className="border border-line px-2 py-1 text-sm" />
            <input name={`close-${index}`} type="time" defaultValue="18:00" className="border border-line px-2 py-1 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input name={`closed-${index}`} type="checkbox" />
              Closed
            </label>
          </div>
        ))}
      </div>
      <button className="mt-4 rounded bg-accent px-4 py-2 text-sm font-semibold text-white">Save hours</button>
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
    </form>
  );
}
