import Link from "next/link";
import { RankedContactCard } from "@/components/rankings/RankedContactCard";
import type { RankingDetail } from "@/services/ranking.service";

function formatGeneratedAt(value: Date): string {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatModelName(value: string | null): string {
  if (!value) return "Rule";
  return value.endsWith("-v1") ? "v1" : value;
}

export function RankingResults({ ranking }: { ranking: RankingDetail }) {
  const topScore = ranking.items[0]?.score ?? null;

  return (
    <main className="min-h-dvh bg-[#f5f1e8] text-emerald-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <nav className="mb-6 flex items-center justify-between gap-3" aria-label="Page navigation">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-950 text-amber-300">✦</span>
            Lodestar
          </Link>
          {ranking.event && (
            <Link
              href={`/events/${ranking.event.id}`}
              className="rounded-full border border-stone-300 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-600"
            >
              Event
            </Link>
          )}
        </nav>

        <section className="rounded-[1.75rem] bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
            Ranking results
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            Top contacts for this goal
          </h1>
          {ranking.event && (
            <p className="mt-3 text-sm font-semibold text-emerald-100 sm:text-base">
              {ranking.event.name}
              {ranking.event.location ? ` · ${ranking.event.location}` : ""}
            </p>
          )}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Goal</p>
            <p className="mt-1 text-sm font-semibold leading-6 sm:text-base">{ranking.goalText}</p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-stone-200 bg-white/70">
          <div className="p-4">
            <strong className="block text-xl">{ranking.items.length}</strong>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ranked</span>
          </div>
          <div className="border-x border-stone-200 p-4">
            <strong className="block text-xl">{topScore === null ? "—" : Math.round(topScore)}</strong>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Top score</span>
          </div>
          <div className="p-4">
            <strong className="block text-xl">{formatModelName(ranking.modelName)}</strong>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Model</span>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
              Generated {formatGeneratedAt(ranking.createdAt)}
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Ranked contacts</h2>
          </div>
          <div className="space-y-3">
            {ranking.items.length > 0 ? (
              ranking.items.map((item) => <RankedContactCard key={item.id} item={item} />)
            ) : (
              <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
                No ranked contacts were saved for this ranking.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
