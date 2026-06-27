import Link from "next/link";
import { ContactListItem } from "@/components/contacts/ContactListItem";
import { RankContactsButton } from "@/components/events/RankContactsButton";
import { ContactListRecord } from "@/services/contact.service";
import { EventDetail } from "@/services/event.service";

function formatDate(startDate: Date | null, endDate: Date | null): string {
  if (!startDate) return "Date to be confirmed";
  const date = new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" });
  if (!endDate || startDate.toDateString() === endDate.toDateString()) return date.format(startDate);
  return `${date.format(startDate)} – ${date.format(endDate)}`;
}

export function EventDashboard({ event, contacts }: { event: EventDetail; contacts: ContactListRecord[] }) {
  const goal = event.eventGoal ?? "Add an event goal to rank these contacts.";
  return (
    <main className="min-h-dvh bg-[#f5f1e8] text-emerald-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <nav className="mb-6 flex items-center justify-between" aria-label="Page navigation">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-950 text-amber-300">✦</span>
            Lodestar
          </Link>
          <span className="rounded-full border border-stone-300 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-600">
            Live event
          </span>
        </nav>

        <section className="overflow-hidden rounded-[1.75rem] bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
            <span>{formatDate(event.startDate, event.endDate)}</span>
            {event.location && <><span aria-hidden="true">•</span><span>{event.location}</span></>}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            {event.name}
          </h1>
          {event.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100 sm:text-base">{event.description}</p>}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Your goal</p>
            <p className="mt-1 text-sm font-semibold leading-6 sm:text-base">{goal}</p>
          </div>
          <div className="mt-5">
            <RankContactsButton eventId={event.id} goalText={goal} />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-stone-200 bg-white/70">
          <div className="p-4"><strong className="block text-xl">{contacts.length}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Contacts</span></div>
          <div className="border-x border-stone-200 p-4"><strong className="block text-xl">{event.tags.length}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Event tags</span></div>
          <div className="p-4"><strong className="block text-xl">Top 5</strong><span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Next view</span></div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">People you met</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Event contacts</h2>
            </div>
            <span className="text-xs font-semibold text-stone-500">{event.contactCount} total</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {contacts.length > 0 ? (
              contacts.map((contact) => <ContactListItem key={contact.id} contact={contact} />)
            ) : (
              <p className="p-6 text-center text-sm text-stone-500">No contacts have been added to this event.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
