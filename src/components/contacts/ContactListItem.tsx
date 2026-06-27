import Link from "next/link";

export type ContactListItemData = {
  id: string;
  fullName: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  languages: unknown;
  sourceType: string | null;
  sourceConfidence: number | null;
  tags: unknown;
  notes: string | null;
};

type ContactListItemProps = {
  contact: ContactListItemData;
};

export function ContactListItem({ contact }: ContactListItemProps) {
  const tags = toStringArray(contact.tags).slice(0, 3);
  const languages = toStringArray(contact.languages).slice(0, 3);
  const confidence =
    typeof contact.sourceConfidence === "number" ? `${Math.round(contact.sourceConfidence * 100)}%` : "Unknown";

  return (
    <li className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/contacts/${contact.id}`}
            className="block truncate text-base font-semibold text-slate-950 hover:text-blue-700"
          >
            {contact.fullName ?? "Unnamed contact"}
          </Link>
          <p className="mt-1 text-sm text-slate-700">
            {compactJoin([contact.title, contact.company], " at ")}
          </p>
          {contact.email ? <p className="mt-1 break-all text-sm text-slate-500">{contact.email}</p> : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 text-xs text-slate-600 sm:justify-end">
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">{confidence}</span>
          {contact.sourceType ? (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{formatLabel(contact.sourceType)}</span>
          ) : null}
        </div>
      </div>

      {contact.notes ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{contact.notes}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
            {formatLabel(tag)}
          </span>
        ))}
        {languages.map((language) => (
          <span key={language} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            {language}
          </span>
        ))}
      </div>
    </li>
  );
}

function compactJoin(values: Array<string | null>, separator: string): string {
  const filtered = values.filter((value): value is string => Boolean(value));
  return filtered.length > 0 ? filtered.join(separator) : "No role details yet";
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatLabel(value: string): string {
  return value.replace(/[-_]/g, " ");
}
