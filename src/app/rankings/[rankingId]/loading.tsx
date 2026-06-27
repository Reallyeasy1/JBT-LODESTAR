export default function RankingLoading() {
  return (
    <main className="min-h-dvh bg-[#f5f1e8] text-emerald-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <div className="h-10 w-32 rounded-xl bg-stone-200" />
        <section className="mt-6 rounded-[1.75rem] bg-emerald-950 p-5 sm:p-8">
          <div className="h-4 w-52 rounded bg-white/20" />
          <div className="mt-5 h-10 w-64 rounded bg-white/20" />
          <div className="mt-6 h-24 rounded-2xl bg-white/10" />
        </section>
        <div className="mt-8 grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-56 rounded-2xl border border-stone-200 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
