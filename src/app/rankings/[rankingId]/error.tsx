"use client";

export default function RankingError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f1e8] px-5 text-center text-emerald-950">
      <div className="max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-xl" aria-hidden="true">!</span>
        <h1 className="mt-4 text-2xl font-black">The ranking could not be loaded</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">Check the saved ranking and database connection, then try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-11 rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
