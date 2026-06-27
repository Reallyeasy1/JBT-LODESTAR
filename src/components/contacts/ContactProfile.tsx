import Link from "next/link";
import type { ContactDetail } from "@/services/contact.service";

function formatSource(value: string | null): string {
  if (!value) return "Unknown source";
  return value.replaceAll("_", " ");
}

function formatSourceConfidence(value: number | null): string {
  if (value === null) return "Unknown";
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

export function ContactProfile({ contact }: { contact: ContactDetail }) {
  const titleLine = [contact.title, contact.company].filter(Boolean).join(" · ");

  return (
    <section className="rounded-[1.75rem] bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
        <span>{formatSource(contact.sourceType)}</span>
        <span aria-hidden="true">•</span>
        <span>{formatSourceConfidence(contact.sourceConfidence)} confidence</span>
      </div>
      <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
        {contact.fullName ?? "Unnamed contact"}
      </h1>
      <p className="mt-3 text-sm font-semibold text-emerald-100 sm:text-base">
        {titleLine || "Profile details not added"}
      </p>

      {contact.event && (
        <Link
          href={`/events/${contact.event.id}`}
          className="mt-5 inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white"
        >
          {contact.event.name}
        </Link>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Languages</p>
          <p className="mt-1 text-sm font-semibold">{contact.languages.join(", ") || "Not recorded"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Contact</p>
          <p className="mt-1 break-words text-sm font-semibold">{contact.email ?? contact.phone ?? "Not recorded"}</p>
        </div>
      </div>

      {contact.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {contact.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-100">
              {tag.replaceAll("-", " ")}
            </span>
          ))}
        </div>
      )}

      {contact.notes && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Source note</p>
          <p className="mt-1 text-sm leading-6 text-emerald-50">{contact.notes}</p>
        </div>
      )}
    </section>
  );
}
