"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ContactListItem, type ContactListItemData } from "@/components/contacts/ContactListItem";

type DashboardEvent = {
  id: string;
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  industry: string | null;
  description: string | null;
  eventGoal: string | null;
  tags: unknown;
  _count: {
    contacts: number;
  };
};

type EventDashboardProps = {
  eventId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; event: DashboardEvent; contacts: ContactListItemData[] };

export function EventDashboard({ eventId }: EventDashboardProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setState({ status: "loading" });

      try {
        const [eventResponse, contactsResponse] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/contacts?eventId=${encodeURIComponent(eventId)}`),
        ]);

        if (!eventResponse.ok) {
          throw new Error(eventResponse.status === 404 ? "Event not found" : "Could not load event");
        }

        if (!contactsResponse.ok) {
          throw new Error("Could not load contacts");
        }

        const eventJson = (await eventResponse.json()) as { event: DashboardEvent };
        const contactsJson = (await contactsResponse.json()) as { contacts: ContactListItemData[] };

        if (active) {
          setState({ status: "ready", event: eventJson.event, contacts: contactsJson.contacts });
        }
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Dashboard failed to load",
          });
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [eventId]);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-48 animate-pulse rounded-md border border-slate-200 bg-white" />
          <div className="mt-4 grid gap-3">
            <div className="h-28 animate-pulse rounded-md border border-slate-200 bg-white" />
            <div className="h-28 animate-pulse rounded-md border border-slate-200 bg-white" />
            <div className="h-28 animate-pulse rounded-md border border-slate-200 bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-md border border-red-200 bg-white p-6">
          <p className="text-sm font-semibold text-red-700">Unable to load event dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{state.message}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Confirm the demo database is seeded and this event belongs to the current user.
          </p>
        </div>
      </main>
    );
  }

  return <LoadedEventDashboard event={state.event} contacts={state.contacts} />;
}

function LoadedEventDashboard({ event, contacts }: { event: DashboardEvent; contacts: ContactListItemData[] }) {
  const tags = useMemo(() => toStringArray(event.tags), [event.tags]);
  const dateRange = formatDateRange(event.startDate, event.endDate);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                {event.industry ? <span className="rounded-md bg-white px-2 py-1">{event.industry}</span> : null}
                {event.location ? <span className="rounded-md bg-white px-2 py-1">{event.location}</span> : null}
                {dateRange ? <span className="rounded-md bg-white px-2 py-1">{dateRange}</span> : null}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">{event.name}</h1>
              {event.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{event.description}</p> : null}
            </div>

            <Link
              href={`/rankings/new?eventId=${event.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Rank Top Contacts
            </Link>
          </div>
        </header>

        <section className="grid gap-4 py-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">Networking Goal</p>
            <p className="mt-2 text-lg font-medium leading-7 text-slate-950">
              {event.eventGoal ?? "No event goal set yet."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Metric label="Contacts" value={contacts.length.toString()} />
            <Metric label="Seed Target" value={event._count.contacts.toString()} />
            <Metric label="Tags" value={tags.length.toString()} />
          </div>
        </section>

        {tags.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <section aria-labelledby="contacts-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="contacts-heading" className="text-xl font-semibold text-slate-950">
                Contacts
              </h2>
              <p className="mt-1 text-sm text-slate-600">{contacts.length} contacts loaded from the event.</p>
            </div>
          </div>

          {contacts.length > 0 ? (
            <ul className="grid gap-3">
              {contacts.map((contact) => (
                <ContactListItem key={contact.id} contact={contact} />
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No contacts have been added to this event yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate && !endDate) return null;

  const formatter = new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const start = startDate ? formatter.format(new Date(startDate)) : null;
  const end = endDate ? formatter.format(new Date(endDate)) : null;

  if (start && end && start !== end) return `${start} - ${end}`;
  return start ?? end;
}
