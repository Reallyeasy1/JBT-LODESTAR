import Link from "next/link";
import { ContactListRecord } from "@/services/contact.service";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ContactListItem({ contact }: { contact: ContactListRecord }) {
  return (
    <Link
      href={`/contacts/${contact.id}`}
      className="group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-200 px-4 py-4 last:border-0 hover:bg-amber-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-5"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-950">
        {initials(contact.fullName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-emerald-950">
          {contact.fullName ?? "Unnamed contact"}
        </span>
        <span className="block truncate text-xs text-stone-500">
          {[contact.title, contact.company].filter(Boolean).join(" · ") || "Details not added"}
        </span>
        {contact.tags.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600"
              >
                {tag.replaceAll("-", " ")}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="text-lg text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800">
        →
      </span>
    </Link>
  );
}
