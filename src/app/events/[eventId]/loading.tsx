export default function EventLoading() {
  return (
    <main className="min-h-dvh bg-[#f5f1e8] px-4 py-6" aria-busy="true" aria-label="Loading event">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-9 w-32 rounded-xl bg-stone-200" />
        <div className="mt-6 h-80 rounded-[1.75rem] bg-emerald-950/15" />
        <div className="mt-8 h-8 w-48 rounded-lg bg-stone-200" />
        <div className="mt-4 h-72 rounded-2xl bg-white" />
      </div>
    </main>
  );
}
