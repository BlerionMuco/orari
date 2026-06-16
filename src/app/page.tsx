import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-bg">
      <div className="max-w-2xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-widest text-text-muted">
          Orari
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text">
          Booking that works the way you actually run the shop.
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          Customers book online. You take payment in person. No PCI, no
          deposits, no Stripe gymnastics.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-surface hover:bg-primary-hover focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-focus"
          >
            Open dashboard
          </Link>
          <Link
            href="/book/demo"
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text hover:border-border-strong focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-focus"
          >
            See a public booking page
          </Link>
        </div>
      </div>
    </main>
  );
}
