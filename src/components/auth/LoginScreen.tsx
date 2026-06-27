import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function LoginScreen() {
  return (
    <main className="min-h-dvh bg-[#ede6d5] text-[#191813]">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl px-4 py-5 sm:px-6 lg:grid-cols-[1fr_430px] lg:gap-10 lg:py-8">
        <section className="flex min-h-[44dvh] flex-col justify-between border border-[#191813] bg-[#191813] p-5 text-[#fffaf0] shadow-[6px_6px_0_rgba(25,24,19,0.22)] sm:p-8 lg:min-h-0">
          <nav className="flex items-center justify-between gap-4" aria-label="Login page navigation">
            <Link href="/" className="inline-flex items-center gap-3 font-black">
              <span className="grid size-10 place-items-center border border-[#191813] bg-[#d7ff51] text-[#191813] shadow-[3px_3px_0_#fffaf0]">
                <Compass size={21} strokeWidth={2.3} />
              </span>
              <span className="text-xl tracking-normal">Lodestar</span>
            </Link>
            <span className="hidden border border-[#fffaf0]/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#d7ff51] sm:inline-flex">
              Demo workspace
            </span>
          </nav>

          <div className="mt-16 max-w-2xl lg:mb-4">
            <div className="mb-5 inline-flex items-center gap-2 border border-[#d7ff51]/50 bg-[#d7ff51]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#d7ff51]">
              <Sparkles size={14} />
              Conference-ready intelligence
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-normal text-[#fffaf0] sm:text-6xl">
              Walk into the room with your next action already ranked.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#e2d9c5] sm:text-base">
              Review event contacts, briefing notes, ranked opportunities, and follow-up drafts before the moment goes cold.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["17", "Contacts captured"],
              ["5", "Priority people"],
              ["3", "Drafts waiting"],
            ].map(([value, label]) => (
              <div key={label} className="border border-[#fffaf0]/18 bg-[#fffaf0]/8 p-4">
                <strong className="block text-3xl font-black text-[#d7ff51]">{value}</strong>
                <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.14em] text-[#e2d9c5]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 flex items-center lg:mt-0" aria-labelledby="login-title">
          <div className="border border-[#191813] bg-[#fffaf0] p-5 shadow-[6px_6px_0_rgba(25,24,19,0.18)] sm:p-7">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ba7354]">
              Welcome back
            </p>
            <h2 id="login-title" className="mb-7 text-3xl font-black tracking-normal">
              Log in
            </h2>

            <form action="/dashboard" className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold" htmlFor="email">
                Email
                <span className="flex items-center gap-2 border border-[#9f927a] bg-white px-3 py-3 focus-within:border-[#191813]">
                  <Mail size={18} className="shrink-0 text-[#667a49]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@lodestar.ai"
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#a7a091]"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-bold" htmlFor="password">
                Password
                <span className="flex items-center gap-2 border border-[#9f927a] bg-white px-3 py-3 focus-within:border-[#191813]">
                  <KeyRound size={18} className="shrink-0 text-[#667a49]" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#a7a091]"
                  />
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="size-4 accent-[#191813]" />
                  Keep me signed in
                </label>
                <Link href="/" className="text-[#ba7354] underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 border border-[#191813] bg-[#d7ff51] px-4 py-3 text-sm font-black shadow-[4px_4px_0_rgba(25,24,19,0.28)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(25,24,19,0.34)]"
              >
                Log in <ArrowRight size={17} />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#777164]">
              <span className="h-px flex-1 bg-[#d3c7ad]" />
              Mock auth
              <span className="h-px flex-1 bg-[#d3c7ad]" />
            </div>

            <Link
              href="/dashboard"
              className="flex min-h-12 items-center justify-center gap-2 border border-[#191813] bg-[#191813] px-4 py-3 text-sm font-black text-[#fffaf0] shadow-[4px_4px_0_rgba(25,24,19,0.18)] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Continue with demo account <BadgeCheck size={17} />
            </Link>

            <div className="mt-6 grid gap-3 border-t border-[#d3c7ad] pt-5 text-xs leading-5 text-[#555143]">
              <p className="flex gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#667a49]" />
                Follow-ups remain drafts until a user reviews and approves them.
              </p>
              <p className="flex gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#667a49]" />
                Real authentication is prepared for Clerk/Auth.js after the MVP demo flow.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
