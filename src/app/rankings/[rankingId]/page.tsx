import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { RankedContactCard } from "@/components/rankings/RankedContactCard";
import { getCurrentUser } from "@/lib/auth";
import { getRankingById } from "@/services/ranking.service";

type RankingPageProps = {
  params: Promise<{
    rankingId: string;
  }>;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { rankingId } = await params;
  const user = await getCurrentUser();
  const ranking = await getRankingById(rankingId, user.id);

  return {
    title: ranking ? `Ranking for ${ranking.eventName ?? "event"} | Lodestar` : "Ranking | Lodestar",
    description: ranking?.goalText ?? "Ranked event contacts in Lodestar.",
  };
}

export default async function RankingPage({ params }: RankingPageProps) {
  const { rankingId } = await params;
  const user = await getCurrentUser();
  const ranking = await getRankingById(rankingId, user.id);

  if (!ranking) {
    notFound();
  }

  const backHref = ranking.eventId ? `/events/${ranking.eventId}` : "/dashboard";

  return (
    <main className="min-h-dvh bg-[#f5f1e8] text-emerald-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2 font-black tracking-normal">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-950 text-amber-300">
              <Compass size={18} aria-hidden="true" />
            </span>
            <span className="truncate">Lodestar</span>
          </Link>
          <Link
            href={backHref}
            className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white text-emerald-950 shadow-sm transition hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Back to event"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </header>

        <section className="overflow-hidden rounded-[1.75rem] bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
            <Trophy size={15} aria-hidden="true" />
            <span>{ranking.eventName ?? "Event ranking"}</span>
            <span aria-hidden="true">/</span>
            <span>{formatDate(ranking.createdAt)}</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-normal sm:text-5xl">
            Top contacts
          </h1>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
              Goal
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 sm:text-base">
              {ranking.goalText}
            </p>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-stone-200 bg-white/70">
          <div className="p-4">
            <strong className="block text-xl">{ranking.items.length}</strong>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ranked</span>
          </div>
          <div className="border-x border-stone-200 p-4">
            <strong className="block text-xl">
              {ranking.items[0]?.score == null ? "N/A" : Math.round(ranking.items[0].score)}
            </strong>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Top score</span>
          </div>
          <div className="p-4">
            <strong className="block break-words text-xl">{ranking.modelName ?? "Manual"}</strong>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Model</span>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
              Next best actions
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">Ranked contact list</h2>
          </div>
          <div className="grid gap-4">
            {ranking.items.map((item) => (
              <RankedContactCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
