"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function RankingError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f1e8] px-4 text-emerald-950">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
          Ranking unavailable
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-normal">The ranking could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Try again, or return to the dashboard and generate a fresh ranking.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Retry
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-emerald-950 transition hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
