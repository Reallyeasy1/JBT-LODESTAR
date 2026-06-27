import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, MessageSquareText } from "lucide-react";
import { notFound } from "next/navigation";
import { demoContacts, followUps } from "@/lib/demo-data";

type ContactPageProps = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { contactId } = await params;
  const contact = demoContacts.find((item) => item.id === contactId);

  return {
    title: contact ? `${contact.name} | Lodestar` : "Contact | Lodestar",
    description: contact ? `${contact.role} at ${contact.company}` : "Lodestar contact detail.",
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { contactId } = await params;
  const contact = demoContacts.find((item) => item.id === contactId);

  if (!contact) {
    notFound();
  }

  const followUp = followUps.find((item) => item.contactId === contact.id);

  return (
    <main className="min-h-dvh bg-[#ede6d5] text-[#191813]">
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center border border-[#191813] bg-[#d7ff51] text-[#191813] shadow-[3px_3px_0_rgba(25,24,19,0.28)]">
              <Compass size={21} strokeWidth={2.3} />
            </span>
            <span className="text-xl tracking-normal">Lodestar</span>
          </Link>
          <Link
            href="/dashboard"
            className="grid size-10 place-items-center border border-[#191813] bg-[#fffaf0] shadow-[3px_3px_0_rgba(25,24,19,0.16)] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
        </header>

        <section className="border border-[#191813] bg-[#fffaf0] p-5 shadow-[6px_6px_0_rgba(25,24,19,0.18)] sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-4xl font-black tracking-normal sm:text-5xl">
                {contact.name}
              </h1>
              <p className="mt-3 break-words text-sm font-bold text-[#555143] sm:text-base">
                {contact.role} · {contact.company}
              </p>
            </div>
            <div className="grid size-16 shrink-0 place-items-center border border-[#191813] bg-[#d7ff51] text-xl font-black shadow-[4px_4px_0_rgba(25,24,19,0.18)]">
              {contact.score}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="border border-[#d3c7ad] bg-[#f7f0df] p-4">
              <h2 className="font-black">Opportunity</h2>
              <p className="mt-2 text-sm font-bold text-[#555143]">{contact.opportunity}</p>
            </div>
            <div className="border border-[#d3c7ad] bg-[#f7f0df] p-4">
              <h2 className="font-black">Next action</h2>
              <p className="mt-2 text-sm font-bold text-[#555143]">{contact.nextAction}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-[#d3c7ad] pt-5">
            <h2 className="font-black">Why this contact matters</h2>
            <p className="mt-2 text-sm leading-6 text-[#312f27]">{contact.reason}</p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="border border-[#d3c7ad] p-4">
              <h2 className="font-black">Evidence</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#312f27]">
                {contact.evidence.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>

            <section className="border border-[#d3c7ad] p-4">
              <h2 className="font-black">Questions</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#312f27]">
                {contact.questions.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          </div>

          {followUp && (
            <section className="mt-6 border border-[#191813] bg-[#191813] p-4 text-[#fffaf0]">
              <div className="mb-3 flex items-center gap-2 font-black">
                <MessageSquareText size={18} />
                Follow-up
              </div>
              <p className="text-sm leading-6 text-[#e2d9c5]">{followUp.draft}</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
