export default function RankingLoading() {
  return (
    <main className="min-h-dvh bg-[#f5f1e8] px-4 py-6" aria-busy="true" aria-label="Loading ranking">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-9 w-32 rounded-xl bg-stone-200" />
        <div className="mt-6 h-72 rounded-[1.75rem] bg-emerald-950/15" />
        <div className="mt-8 h-8 w-56 rounded-lg bg-stone-200" />
        <div className="mt-4 space-y-3">
          <div className="h-64 rounded-3xl bg-white" />
          <div className="h-64 rounded-3xl bg-white" />
        </div>
      </div>
    </main>
  );
}
