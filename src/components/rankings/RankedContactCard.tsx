import Link from "next/link";
import { ArrowRight, CheckCircle2, Gauge, MessageSquareText } from "lucide-react";
import { RankingDetailItem } from "@/services/ranking.service";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatOpportunity(value: string | null): string {
  if (!value) return "Opportunity";
  return value.replaceAll("-", " ");
}

export function RankedContactCard({ item }: { item: RankingDetailItem }) {
  const contactName = item.contact.fullName ?? "Unnamed contact";
  const score = item.score == null ? "N/A" : Math.round(item.score).toString();
  const confidence = item.confidence == null ? "N/A" : `${Math.round(item.confidence)}%`;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-950">
            {initials(contactName)}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
              Rank {item.rankPosition}
            </p>
            <h2 className="mt-1 break-words text-xl font-black tracking-normal text-emerald-950">
              {contactName}
            </h2>
            <p className="mt-1 break-words text-sm font-semibold text-stone-500">
              {[item.contact.title, item.contact.company].filter(Boolean).join(" · ") || "Details not added"}
            </p>
          </div>
        </div>
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-lg font-black text-white">
          {score}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-amber-100 px-3 text-xs font-bold capitalize text-amber-900">
          <CheckCircle2 size={14} aria-hidden="true" />
          {formatOpportunity(item.opportunityType)}
        </span>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-stone-100 px-3 text-xs font-bold text-stone-700">
          <Gauge size={14} aria-hidden="true" />
          {confidence} confidence
        </span>
      </div>

      {item.reasoning && (
        <p className="mt-4 text-sm leading-6 text-stone-700">
          {item.reasoning}
        </p>
      )}

      {item.nextAction && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-900">
            <MessageSquareText size={14} aria-hidden="true" />
            Next action
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">
            {item.nextAction}
          </p>
        </div>
      )}

      {item.evidence.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-stone-600">
          {item.evidence.slice(0, 3).map((evidence) => (
            <li key={evidence} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{evidence}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/contacts/${item.contactId}`}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:w-auto"
      >
        Open contact
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}
