export type BriefingCardData = {
  id?: string;
  briefingId?: string;
  personSummary: string | null;
  whyTheyMatter: string | null;
  likelyGoal?: string | null;
  decisionAuthority: string | null;
  talkingPoints: string[];
  questionsToAsk: string[];
  culturalNotes: string[];
  warnings: string[];
  confidenceScore: number | null;
  createdAt?: string;
};

function formatAuthority(value: string | null): string {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ");
}

function formatConfidence(value: number | null): string {
  if (value === null) return "Unknown";
  return `${Math.round(value)}%`;
}

export function BriefingCard({ briefing }: { briefing: BriefingCardData }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">AI briefing</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-950">What to know</h2>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
          <p className="text-lg font-black text-emerald-950">{formatConfidence(briefing.confidenceScore)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Confidence</p>
        </div>
      </div>

      <div className="mt-5 space-y-4 text-sm leading-6 text-stone-700">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Summary</p>
          <p className="mt-1">{briefing.personSummary ?? "No summary has been generated yet."}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Why they matter</p>
          <p className="mt-1">{briefing.whyTheyMatter ?? "No relevance explanation has been generated yet."}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Likely role</p>
            <p className="mt-1 font-bold capitalize text-emerald-950">{formatAuthority(briefing.decisionAuthority)}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Likely goal</p>
            <p className="mt-1 font-bold text-emerald-950">{briefing.likelyGoal ?? "Ask directly"}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-black text-emerald-950">Talking points</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
            {briefing.talkingPoints.map((point) => (
              <li key={point} className="rounded-2xl bg-stone-50 px-3 py-2">{point}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-black text-emerald-950">Questions to ask</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
            {briefing.questionsToAsk.map((question) => (
              <li key={question} className="rounded-2xl bg-stone-50 px-3 py-2">{question}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-black text-emerald-950">Cultural notes</h3>
        <p className="mt-1 text-xs leading-5 text-stone-600">
          Treat these as uncertain guidance, not assumptions. Confirm directly when it matters.
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
          {(briefing.culturalNotes.length > 0 ? briefing.culturalNotes : ["No cultural or language-specific note is recorded."]).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      {briefing.warnings.length > 0 && (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
          <h3 className="text-sm font-black text-red-900">Warnings</h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-red-800">
            {briefing.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
