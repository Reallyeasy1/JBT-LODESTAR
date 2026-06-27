"use client";

export default function ContactError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-dvh bg-[#f5f1e8] px-4 py-6 text-emerald-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Contact error</p>
        <h1 className="mt-2 text-2xl font-black">Unable to load this contact</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-11 rounded-2xl bg-emerald-950 px-5 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
