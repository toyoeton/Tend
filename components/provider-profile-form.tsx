"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const serviceTypes = ["LAUNDRY", "CLEANING", "DISPATCH", "OTHER"] as const;

export function ProviderProfileForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [showServiceForm, setShowServiceForm] = useState(false);

  async function submitProfile(formData: FormData) {
    const response = await fetch("/api/providers/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: String(formData.get("businessName")),
        bio: String(formData.get("bio")),
        address: String(formData.get("address")),
        isActive: formData.get("isActive") === "on"
      })
    });
    setMessage(response.ok ? "Profile saved" : "Could not save profile");
    router.refresh();
  }

  async function submitService(formData: FormData) {
    const response = await fetch("/api/providers/me/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: String(formData.get("type")),
        name: String(formData.get("name")),
        description: String(formData.get("description")),
        price: Math.round(Number(formData.get("price")) * 100),
        durationMins: Number(formData.get("durationMins"))
      })
    });
    setMessage(response.ok ? "Service added" : "Could not add service");
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={(data) => void submitProfile(data)} className="grid gap-3 border border-line bg-white p-5">
        <h2 className="font-semibold">Business profile</h2>
        <input name="businessName" placeholder="Business name" className="border border-line px-3 py-2" required />
        <textarea name="bio" placeholder="Bio" className="min-h-24 border border-line px-3 py-2" />
        <input name="address" placeholder="Address" className="border border-line px-3 py-2" required />
        <label className="flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked />
          Accepting bookings
        </label>
        <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white">Save profile</button>
      </form>
      <div>
        <button
          type="button"
          onClick={() => setShowServiceForm((visible) => !visible)}
          className="rounded border border-accent px-4 py-2 text-sm font-semibold text-accent"
        >
          {showServiceForm ? "− Close" : "+ Add service"}
        </button>
        {showServiceForm ? (
          <form action={(data) => void submitService(data)} className="mt-3 grid gap-3 border border-line bg-white p-5">
            <h2 className="font-semibold">Add service</h2>
            <select name="type" className="border border-line px-3 py-2">
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </select>
            <input name="name" placeholder="Service name" className="border border-line px-3 py-2" required />
            <textarea name="description" placeholder="Description" className="min-h-20 border border-line px-3 py-2" />
            <input name="price" type="number" placeholder="Price in naira" className="border border-line px-3 py-2" required />
            <input name="durationMins" type="number" placeholder="Duration minutes" className="border border-line px-3 py-2" required />
            <button className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white">Add service</button>
          </form>
        ) : null}
      </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
