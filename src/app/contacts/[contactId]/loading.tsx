export default function ContactLoading() {
  return (
    <main className="min-h-dvh bg-[#f5f1e8] px-4 py-6" aria-busy="true" aria-label="Loading contact">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-9 w-32 rounded-xl bg-stone-200" />
        <div className="mt-6 h-96 rounded-[1.75rem] bg-emerald-950/15" />
        <div className="mt-5 h-44 rounded-3xl bg-white" />
        <div className="mt-5 h-72 rounded-3xl bg-white" />
      </div>
    </main>
  );
}
