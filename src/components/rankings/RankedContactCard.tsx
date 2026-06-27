import Link from "next/link";
import type { RankedContactResult } from "@/services/ranking.service";

function formatOpportunity(value: string | null): string {
  if (!value) return "Opportunity";
  return value.replaceAll("-", " ");
}

function formatPercent(value: number | null): string {
  if (value === null) return "Unknown";
  return `${Math.round(value)}%`;
}

function formatScore(value: number | null): string {
  if (value === null) return "—";
  return String(Math.round(value));
}

export function RankedContactCard({ item }: { item: RankedContactResult }) {
  const contactTitle = [item.contact.title, item.contact.company].filter(Boolean).join(" · ");

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <Link
        href={`/contacts/${item.contact.id}`}
        className="block p-4 transition hover:bg-amber-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-sm font-black text-amber-300">
            #{item.rankPosition}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black text-emerald-950">
                {item.contact.fullName ?? "Unnamed contact"}
              </h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-900">
                {formatOpportunity(item.opportunityType)}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-stone-500">
              {contactTitle || "Details not added"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-tight text-emerald-950">{formatScore(item.score)}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Score</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 text-sm">
          <div className="border-r border-stone-200 p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Confidence</dt>
            <dd className="mt-1 font-black text-emerald-950">{formatPercent(item.confidence)}</dd>
          </div>
          <div className="p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Next step</dt>
            <dd className="mt-1 truncate font-black text-emerald-950">{item.nextAction ?? "Review contact"}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Reasoning</p>
            <p className="mt-1">{item.reasoning ?? "No reasoning was generated for this contact."}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Recommended action</p>
            <p className="mt-1">{item.nextAction ?? "Open the contact profile and add follow-up notes."}</p>
          </div>
        </div>

        {item.evidence.signals.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.evidence.signals.slice(0, 3).map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600"
              >
                {signal}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}
