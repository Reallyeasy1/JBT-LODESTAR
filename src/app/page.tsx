import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const DEMO_EVENT_ID = "cle00000000000000000001";

const workflow = [
  {
    icon: Users,
    title: "6 event contacts",
    description: "Seeded from the Sup Build2026 demo event.",
  },
  {
    icon: Target,
    title: "Top 5 ranked",
    description: "Deterministic scoring turns a noisy room into a priority list.",
  },
  {
    icon: FileText,
    title: "Briefing ready",
    description: "Open the person who matters and see why, with grounded talking points.",
  },
  {
    icon: MessageSquareText,
    title: "Draft follow-up",
    description: "Write the note, generate the email, review before anything leaves.",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#ede6d5] text-[#191813]">
      <section className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute right-[-12rem] top-[-10rem] h-80 w-80 rounded-full bg-[#d7ff51]/45 blur-3xl" />
        <div className="absolute bottom-10 left-[-10rem] h-72 w-72 rounded-full bg-[#78d8cf]/35 blur-3xl" />

        <nav className="relative z-10 flex items-center justify-between gap-4" aria-label="Landing navigation">
          <Link href="/" className="inline-flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center border border-[#191813] bg-[#d7ff51] text-[#191813] shadow-[3px_3px_0_#191813]">
              <Compass size={21} strokeWidth={2.3} />
            </span>
            <span className="text-xl tracking-normal">Lodestar</span>
          </Link>
          <Link
            href="/login"
            className="hidden border border-[#191813] bg-[#fffaf0] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_rgba(25,24,19,0.16)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 sm:inline-flex"
          >
            Mock login
          </Link>
        </nav>

        <div className="relative z-10 grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.06fr_0.94fr] lg:py-16">
          <section>
            <div className="mb-5 inline-flex items-center gap-2 border border-[#191813] bg-[#fffaf0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-[3px_3px_0_rgba(25,24,19,0.16)]">
              <Sparkles size={14} className="text-[#ba7354]" />
              The 30-second event demo
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.06em] text-[#191813] sm:text-7xl lg:text-8xl">
              Turn the room into ranked next actions.
            </h1>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-[#555143] sm:text-lg">
              Scan the room. Know who matters. Follow up before the opportunity goes cold.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/events/${DEMO_EVENT_ID}`}
                className="inline-flex min-h-14 items-center justify-center gap-2 border border-[#191813] bg-[#d7ff51] px-6 py-4 text-sm font-black shadow-[5px_5px_0_rgba(25,24,19,0.28)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(25,24,19,0.34)]"
              >
                Start the live demo <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-14 items-center justify-center border border-[#191813] bg-[#191813] px-6 py-4 text-sm font-black text-[#fffaf0] shadow-[5px_5px_0_rgba(25,24,19,0.18)] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                Open app shell
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["1 click", "to seeded event"],
                ["Top 5", "ranked contacts"],
                ["Draft only", "never auto-send"],
              ].map(([value, label]) => (
                <div key={label} className="border border-[#191813]/20 bg-[#fffaf0]/80 p-4 shadow-[3px_3px_0_rgba(25,24,19,0.08)]">
                  <strong className="block text-2xl font-black">{value}</strong>
                  <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.14em] text-[#777164]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside className="border border-[#191813] bg-[#191813] p-4 text-[#fffaf0] shadow-[8px_8px_0_rgba(25,24,19,0.18)] sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[#fffaf0]/15 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d7ff51]">
                  Product crux
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                  Leave with actions, not names.
                </h2>
              </div>
              <BadgeCheck className="shrink-0 text-[#d7ff51]" size={28} />
            </div>

            <div className="mt-5 grid gap-3">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="grid grid-cols-[auto_1fr] gap-3 border border-[#fffaf0]/15 bg-[#fffaf0]/8 p-4"
                  >
                    <span className="grid size-10 place-items-center border border-[#d7ff51]/40 bg-[#d7ff51]/10 text-[#d7ff51]">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e2d9c5]">
                        Step {index + 1}
                      </span>
                      <strong className="mt-1 block text-base font-black">{step.title}</strong>
                      <span className="mt-1 block text-sm leading-6 text-[#e2d9c5]">
                        {step.description}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3 border border-[#d7ff51]/30 bg-[#d7ff51]/10 p-4 text-sm leading-6 text-[#fffaf0]">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#d7ff51]" size={19} />
              <p>
                Every AI-like output stays bounded, traceable, editable, and review-only. No scraping. No autonomous sending.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
