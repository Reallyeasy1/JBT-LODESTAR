import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f5f1e8] px-4 py-6 text-emerald-950 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-5xl flex-col justify-center">
        <nav className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-950 text-amber-300">✦</span>
            Lodestar
          </div>
          <span className="rounded-full border border-stone-300 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-600">
            Demo ready
          </span>
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
              30-second event networking demo
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">
              Scan the room. Know who matters. Follow up before the opportunity goes cold.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-100 sm:text-lg">
              Open the seeded Sup Build2026 event, rank the top contacts, inspect Sarah Tan’s briefing,
              generate a Japanese opener, save a note, and draft a review-only follow-up.
            </p>
            <Link
              href="/events/cle00000000000000000001"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-300 px-6 text-sm font-black text-emerald-950 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Start 30-second demo →
            </Link>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Demo path</p>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
              <li className="rounded-2xl bg-stone-50 p-3"><strong className="text-emerald-950">1.</strong> Event dashboard with 6 seeded contacts</li>
              <li className="rounded-2xl bg-stone-50 p-3"><strong className="text-emerald-950">2.</strong> Rank top 5 contacts for the event goal</li>
              <li className="rounded-2xl bg-stone-50 p-3"><strong className="text-emerald-950">3.</strong> Open Sarah Tan’s contact detail page</li>
              <li className="rounded-2xl bg-stone-50 p-3"><strong className="text-emerald-950">4.</strong> Generate intro, save note, draft follow-up</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
