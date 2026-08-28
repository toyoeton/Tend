import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";

export default function HomePage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-16">
      <div className="flex flex-col justify-center">
        <p className="mb-3 text-sm font-semibold uppercase text-accent">Local services, booked ahead</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-normal md:text-6xl">Tend</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
          Browse nearby laundry, cleaning, dispatch, and errand providers. Pick a slot, pay upfront, and manage the
          booking without back-and-forth calls.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/providers" className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white">
            Browse providers
          </Link>
          <AuthButtons />
        </div>
      </div>
      <div className="border border-line bg-white p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="font-semibold">Today in Uyo</span>
          <span className="text-sm text-accent">Open slots</span>
        </div>
        {["QuickFold Laundry", "Amina Home Care", "Tayo Errands"].map((name, index) => (
          <div key={name} className="grid grid-cols-[1fr_auto] gap-3 border-b border-line py-4 last:border-0">
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted">{index === 0 ? "Laundry" : index === 1 ? "Cleaning" : "Dispatch"}</p>
            </div>
            <span className="self-start rounded border border-line px-2 py-1 text-sm">{index + 3} slots</span>
          </div>
        ))}
      </div>
    </section>
  );
}
