"use client";

import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Compass,
  Copy,
  Database,
  Download,
  FileUp,
  Home,
  Languages,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircleQuestion,
  MessageSquareText,
  PenLine,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Contact,
  demoContacts,
  event,
  followUps,
} from "@/lib/demo-data";

type View = "home" | "contacts" | "capture" | "followups" | "profile";

const navigation = [
  { id: "home" as const, label: "Today", icon: Home },
  { id: "contacts" as const, label: "People", icon: Users },
  { id: "capture" as const, label: "Capture", icon: ScanLine },
  {
    id: "followups" as const,
    label: "Follow-ups",
    shortLabel: "Follow up",
    icon: MessageSquareText,
  },
  { id: "profile" as const, label: "Profile", icon: UserRound },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="Lodestar">
      <span className="brand-mark" aria-hidden="true">
        <Compass size={compact ? 18 : 21} strokeWidth={2.2} />
      </span>
      {!compact && <span className="brand-name">Lodestar</span>}
    </div>
  );
}

function Avatar({ contact, size = "medium" }: { contact: Contact; size?: "small" | "medium" | "large" }) {
  return (
    <span className={`avatar avatar-${size} avatar-${contact.accent}`} aria-hidden="true">
      {contact.initials}
    </span>
  );
}

function ScoreRing({ score, compact = false }: { score: number; compact?: boolean }) {
  return (
    <span className={`score-ring ${compact ? "score-ring-compact" : ""}`}>
      <strong>{score}</strong>
      {!compact && <span>match</span>}
    </span>
  );
}

function ShellHeader({ title }: { title: string }) {
  return (
    <header className="mobile-header">
      <Logo />
      <div className="mobile-header-title">{title}</div>
      <button className="icon-button notification-button" aria-label="Notifications">
        <Bell size={19} />
        <span className="notification-dot" />
      </button>
    </header>
  );
}

function DesktopSidebar({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <aside className="desktop-sidebar">
      <Logo />
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "desktop-nav-item active" : "desktop-nav-item"}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.id === "followups" && <span className="nav-count">3</span>}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-event">
        <span className="eyebrow">Active event</span>
        <strong>{event.name}</strong>
        <span>{event.date} · {event.venue}</span>
      </div>
      <div className="sidebar-profile">
        <span className="profile-avatar">KX</span>
        <span>
          <strong>Kee Zhen Xian</strong>
          <small>Founder · Lodestar</small>
        </span>
        <ChevronRight size={16} />
      </div>
    </aside>
  );
}

function MobileNav({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isCapture = item.id === "capture";
        return (
          <button
            key={item.id}
            className={`${view === item.id ? "mobile-nav-item active" : "mobile-nav-item"} ${isCapture ? "capture-nav-item" : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
          >
            <span className={isCapture ? "capture-nav-icon" : "mobile-nav-icon"}>
              <Icon size={isCapture ? 23 : 21} />
            </span>
            <span>{item.shortLabel ?? item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function EventContext() {
  return (
    <section className="event-context" aria-label="Active event">
      <div className="event-date-tile">
        <span>JUN</span>
        <strong>27</strong>
      </div>
      <div className="event-context-copy">
        <span className="eyebrow">Active event</span>
        <strong>{event.name}</strong>
        <span><MapPin size={13} /> {event.venue}</span>
      </div>
      <button className="icon-button" aria-label="View event details">
        <ChevronRight size={18} />
      </button>
    </section>
  );
}

function PriorityContact({ contact, onOpen }: { contact: Contact; onOpen: () => void }) {
  return (
    <article className="priority-card">
      <div className="priority-card-topline">
        <span className="rank-pill"><Sparkles size={13} /> Top opportunity</span>
        <span className="confidence-label">High confidence</span>
      </div>
      <div className="priority-person">
        <Avatar contact={contact} size="large" />
        <div>
          <h3>{contact.name}</h3>
          <p>{contact.role} · {contact.company}</p>
          <span className="opportunity-pill">{contact.opportunity}</span>
        </div>
        <ScoreRing score={contact.score} />
      </div>
      <div className="reason-block">
        <span>Why now</span>
        <p>{contact.reason}</p>
      </div>
      <div className="next-action-row">
        <span className="next-action-icon"><ArrowRight size={16} /></span>
        <div>
          <span>Recommended next action</span>
          <strong>{contact.nextAction}</strong>
        </div>
      </div>
      <button className="primary-button full-width" onClick={onOpen}>
        Open briefing <ArrowRight size={17} />
      </button>
    </article>
  );
}

function CompactContact({ contact, onOpen }: { contact: Contact; onOpen: () => void }) {
  return (
    <button className="compact-contact" onClick={onOpen}>
      <Avatar contact={contact} />
      <span className="compact-contact-main">
        <strong>{contact.name}</strong>
        <span>{contact.role} · {contact.company}</span>
        <small>{contact.opportunity}</small>
      </span>
      <ScoreRing score={contact.score} compact />
      <ChevronRight size={17} className="compact-chevron" />
    </button>
  );
}

function Dashboard({
  contacts,
  onOpenContact,
  onNavigate,
}: {
  contacts: Contact[];
  onOpenContact: (contact: Contact) => void;
  onNavigate: (view: View) => void;
}) {
  const rankedContacts = [...contacts].sort((left, right) => right.score - left.score);

  return (
    <div className="view-stack dashboard-view">
      <ShellHeader title="Today" />
      <div className="desktop-page-header">
        <div>
          <span className="eyebrow">Saturday, 27 June</span>
          <h1>Good afternoon, Kee.</h1>
          <p>Your event has <strong>three next actions</strong> worth moving today.</p>
        </div>
        <div className="desktop-header-actions">
          <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
          <button className="primary-button" onClick={() => onNavigate("capture")}>
            <Plus size={17} /> Add contact
          </button>
        </div>
      </div>

      <EventContext />

      <section className="mobile-greeting">
        <span className="eyebrow">Your next move</span>
        <h1>Know who matters<br />before the moment cools.</h1>
        <p>Three people are ready for a meaningful follow-up.</p>
      </section>

      <section className="metrics-strip" aria-label="Event summary">
        <div><strong>17</strong><span>contacts</span></div>
        <div><strong>5</strong><span>priority</span></div>
        <div><strong>3</strong><span>due now</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Ranked for your goal</span>
            <h2>Best next move</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("contacts")}>See all</button>
        </div>
        <PriorityContact contact={rankedContacts[0]} onOpen={() => onOpenContact(rankedContacts[0])} />
      </section>

      <section className="section-block">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Priority queue</span>
            <h2>Keep momentum</h2>
          </div>
          <span className="section-count">4 people</span>
        </div>
        <div className="contact-list-card">
          {rankedContacts.slice(1, 4).map((contact) => (
            <CompactContact key={contact.id} contact={contact} onOpen={() => onOpenContact(contact)} />
          ))}
        </div>
      </section>

      <section className="quick-actions-section">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">At the event</span>
            <h2>Capture context fast</h2>
          </div>
        </div>
        <div className="quick-action-grid">
          <button className="quick-action camera-action" onClick={() => onNavigate("capture")}>
            <span><Camera size={21} /></span>
            <strong>Scan card</strong>
            <small>Extract contact details</small>
          </button>
          <button className="quick-action" onClick={() => onNavigate("capture")}>
            <span><PenLine size={21} /></span>
            <strong>Add note</strong>
            <small>Remember what mattered</small>
          </button>
        </div>
      </section>
    </div>
  );
}

function ContactsView({
  contacts,
  onOpenContact,
}: {
  contacts: Contact[];
  onOpenContact: (contact: Contact) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ranked" | "today" | "all">("ranked");
  const filtered = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    const matching = contacts.filter((contact) =>
      [contact.name, contact.role, contact.company, contact.opportunity]
        .join(" ")
        .toLowerCase()
        .includes(normalised),
    );
    return filter === "ranked"
      ? [...matching].sort((left, right) => right.score - left.score)
      : matching;
  }, [contacts, filter, query]);

  return (
    <div className="view-stack standard-view">
      <ShellHeader title="People" />
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Relationship map</span>
          <h1>People</h1>
          <p>Ranked against your current event goal.</p>
        </div>
        <button className="round-add-button" aria-label="Add contact"><Plus size={21} /></button>
      </div>
      <div className="search-row">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, roles, companies"
            aria-label="Search contacts"
          />
        </label>
        <button className="filter-button" aria-label="Contact filters"><SlidersHorizontal size={18} /></button>
      </div>
      <div className="segmented-control" role="group" aria-label="Contact view">
        {(["ranked", "today", "all"] as const).map((item) => (
          <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            {item === "ranked" ? "Top ranked" : item === "today" ? "Met today" : "All people"}
          </button>
        ))}
      </div>
      <div className="list-summary">
        <span>{filtered.length} people</span>
        <span><TrendingUp size={14} /> Goal-weighted ranking</span>
      </div>
      <div className="ranked-contact-list">
        {filtered.map((contact, index) => (
          <button className="ranked-contact" key={contact.id} onClick={() => onOpenContact(contact)}>
            <span className="rank-number">{index + 1}</span>
            <Avatar contact={contact} size="large" />
            <span className="ranked-contact-main">
              <span className="ranked-contact-title">
                <strong>{contact.name}</strong>
                <span className={`status-dot ${contact.status === "Act today" ? "urgent" : ""}`} />
              </span>
              <span>{contact.role} · {contact.company}</span>
              <small>{contact.opportunity}</small>
              <em>{contact.reason}</em>
            </span>
            <span className="ranked-contact-score">
              <strong>{contact.score}</strong>
              <small>match</small>
            </span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <Search size={24} />
          <strong>No matching people</strong>
          <span>Try a name, company, role, or opportunity type.</span>
        </div>
      )}
    </div>
  );
}

function CaptureView({ onAdd }: { onAdd: (contact: Contact) => void }) {
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");

  function submitManual(eventValue: FormEvent<HTMLFormElement>) {
    eventValue.preventDefault();
    if (!name.trim()) return;
    const parts = name.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    onAdd({
      id: `manual-${Date.now()}`,
      initials,
      name: name.trim(),
      role: role.trim() || "Role not added",
      company: company.trim() || "Company not added",
      score: 55,
      opportunity: "Needs review",
      reason: "New contact added manually. Add more context before ranking.",
      nextAction: "Confirm their role and capture what you discussed.",
      status: "Explore",
      accent: "sage",
      tags: ["New", "Manual entry"],
      evidence: note.trim() ? [note.trim()] : ["No interaction note has been added yet."],
      opener: "Add a meeting note to generate an evidence-backed opener.",
      questions: ["What outcome were they looking for at this event?"],
    });
    setName("");
    setRole("");
    setCompany("");
    setNote("");
  }

  return (
    <div className="view-stack standard-view capture-view">
      <ShellHeader title="Capture" />
      <div className="page-title-row">
        <div>
          <span className="eyebrow">In the moment</span>
          <h1>Capture contact</h1>
          <p>Save the person and the context while it is fresh.</p>
        </div>
      </div>
      <div className="segmented-control capture-tabs" role="group" aria-label="Capture method">
        <button className={mode === "scan" ? "active" : ""} onClick={() => setMode("scan")}>Scan or import</button>
        <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Manual entry</button>
      </div>

      {mode === "scan" ? (
        <>
          <section className="camera-card">
            <div className="camera-frame" aria-hidden="true">
              <span className="camera-corner top-left" />
              <span className="camera-corner top-right" />
              <span className="camera-corner bottom-left" />
              <span className="camera-corner bottom-right" />
              <Camera size={40} />
            </div>
            <span className="eyebrow">Business card</span>
            <h2>Point, capture, confirm.</h2>
            <p>We’ll extract fields and flag anything uncertain before saving.</p>
            <label className="primary-button camera-button">
              <Camera size={18} /> Open camera
              <input type="file" accept="image/*" capture="environment" aria-label="Photograph business card" />
            </label>
            <span className="privacy-note"><ShieldCheck size={14} /> Image is discarded after extraction by default</span>
          </section>
          <div className="capture-options">
            <label className="capture-option">
              <span className="capture-option-icon"><QrCode size={21} /></span>
              <span><strong>Scan QR code</strong><small>Contact card or event badge</small></span>
              <ChevronRight size={18} />
              <input type="file" accept="image/*" capture="environment" aria-label="Scan QR code" />
            </label>
            <label className="capture-option">
              <span className="capture-option-icon"><FileUp size={21} /></span>
              <span><strong>Import contact file</strong><small>.vcf and contact cards</small></span>
              <ChevronRight size={18} />
              <input type="file" accept=".vcf,text/vcard" aria-label="Import VCF contact file" />
            </label>
            <button className="capture-option" onClick={() => setMode("manual")}>
              <span className="capture-option-icon"><PenLine size={21} /></span>
              <span><strong>Paste profile details</strong><small>LinkedIn text or event bio</small></span>
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      ) : (
        <form className="manual-form" onSubmit={submitManual}>
          <div className="form-intro">
            <span className="form-icon"><PenLine size={22} /></span>
            <div><h2>Add the essentials</h2><p>You can enrich and rank this contact later.</p></div>
          </div>
          <label>
            Full name <span>Required</span>
            <input value={name} onChange={(eventValue) => setName(eventValue.target.value)} placeholder="e.g. Priya Nair" required />
          </label>
          <div className="form-grid-two">
            <label>
              Role
              <span className="input-with-icon"><BriefcaseBusiness size={17} /><input value={role} onChange={(eventValue) => setRole(eventValue.target.value)} placeholder="Product lead" /></span>
            </label>
            <label>
              Company
              <span className="input-with-icon"><Building2 size={17} /><input value={company} onChange={(eventValue) => setCompany(eventValue.target.value)} placeholder="Company" /></span>
            </label>
          </div>
          <label>
            What did you discuss?
            <textarea value={note} onChange={(eventValue) => setNote(eventValue.target.value)} placeholder="Capture one useful detail, promise, or next step…" rows={5} />
          </label>
          <button className="primary-button full-width form-submit" type="submit" disabled={!name.trim()}>
            Save contact <ArrowRight size={17} />
          </button>
        </form>
      )}
    </div>
  );
}

function FollowupsView({ onOpenContact, onToast }: { onOpenContact: (id: string) => void; onToast: (message: string) => void }) {
  const [selected, setSelected] = useState(followUps[0].id);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(followUps.map((item) => [item.id, item.draft])));
  const [approved, setApproved] = useState<string[]>([]);
  const active = followUps.find((item) => item.id === selected) ?? followUps[0];

  async function copyDraft() {
    await navigator.clipboard?.writeText(drafts[active.id]);
    onToast("Draft copied to clipboard");
  }

  function approveDraft() {
    setApproved((current) => current.includes(active.id) ? current : [...current, active.id]);
    onToast("Draft approved — nothing was sent");
  }

  return (
    <div className="view-stack standard-view followups-view">
      <ShellHeader title="Follow-ups" />
      <div className="page-title-row">
        <div>
          <span className="eyebrow">Keep momentum</span>
          <h1>Follow-ups</h1>
          <p>Review every draft before anything leaves Lodestar.</p>
        </div>
      </div>
      <div className="followup-summary">
        <div><Clock3 size={19} /><span><strong>2</strong> due soon</span></div>
        <div><CircleCheck size={19} /><span><strong>{approved.length}</strong> approved</span></div>
      </div>
      <section className="followup-list">
        <div className="section-heading compact-heading">
          <div><span className="eyebrow">Review queue</span><h2>Drafts to finish</h2></div>
        </div>
        {followUps.map((item) => (
          <button key={item.id} className={selected === item.id ? "followup-item active" : "followup-item"} onClick={() => setSelected(item.id)}>
            <span className={`followup-channel channel-${item.channel.toLowerCase()}`}>
              {item.channel === "Email" ? <Mail size={18} /> : item.channel === "LinkedIn" ? <MessageSquareText size={18} /> : <Send size={18} />}
            </span>
            <span className="followup-item-main">
              <span><strong>{item.name}</strong><small>{item.due}</small></span>
              <span>{item.company} · {item.channel}</span>
            </span>
            {approved.includes(item.id) ? <Check size={18} className="approved-check" /> : <ChevronRight size={17} />}
          </button>
        ))}
      </section>
      <section className="draft-editor">
        <div className="draft-editor-header">
          <div>
            <span className="eyebrow">{active.channel} draft</span>
            <h2>Message for {active.name}</h2>
          </div>
          <button className="icon-button" onClick={() => onOpenContact(active.contactId)} aria-label={`Open ${active.name}'s briefing`}><Lightbulb size={18} /></button>
        </div>
        <textarea
          value={drafts[active.id]}
          onChange={(eventValue) => setDrafts((current) => ({ ...current, [active.id]: eventValue.target.value }))}
          rows={8}
          aria-label={`Follow-up draft for ${active.name}`}
        />
        <div className="draft-safety"><ShieldCheck size={15} /><span>Only confirmed meeting context is included. Approval never sends automatically.</span></div>
        <div className="draft-actions">
          <button className="secondary-button" onClick={copyDraft}><Copy size={17} /> Copy</button>
          <button className="primary-button" onClick={approveDraft}>
            {approved.includes(active.id) ? <><Check size={17} /> Approved</> : <>Approve draft <ArrowRight size={17} /></>}
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfileView({ onToast }: { onToast: (message: string) => void }) {
  const [goal, setGoal] = useState(event.goal);
  return (
    <div className="view-stack standard-view profile-view">
      <ShellHeader title="Profile" />
      <div className="profile-hero">
        <span className="profile-avatar profile-avatar-large">KX</span>
        <h1>Kee Zhen Xian</h1>
        <p>Founder · Lodestar</p>
        <span className="profile-completion"><CircleCheck size={15} /> Profile ready for ranking</span>
      </div>
      <section className="settings-section">
        <span className="eyebrow">Current lens</span>
        <h2>Networking goal</h2>
        <p>Lodestar uses this goal to rank every contact and explain why they matter.</p>
        <label className="goal-field">
          <Target size={19} />
          <textarea value={goal} onChange={(eventValue) => setGoal(eventValue.target.value)} rows={3} />
        </label>
        <button className="primary-button full-width" onClick={() => onToast("Networking goal updated locally")}>
          Save goal <Check size={17} />
        </button>
      </section>
      <section className="settings-section settings-list">
        <span className="eyebrow">Preferences & data</span>
        <button><Languages size={19} /><span><strong>Language & tone</strong><small>English · Concise and warm</small></span><ChevronRight size={17} /></button>
        <button><ShieldCheck size={19} /><span><strong>Privacy controls</strong><small>Review retention and AI settings</small></span><ChevronRight size={17} /></button>
        <button><Database size={19} /><span><strong>Relationship memory</strong><small>See what Lodestar remembers</small></span><ChevronRight size={17} /></button>
        <button><Download size={19} /><span><strong>Export my data</strong><small>Contacts, events, notes, and drafts</small></span><ChevronRight size={17} /></button>
        <button className="danger-row"><Trash2 size={19} /><span><strong>Delete account data</strong><small>Permanent and auditable</small></span><ChevronRight size={17} /></button>
      </section>
    </div>
  );
}

function InsightRail({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <aside className="insight-rail">
      <section className="rail-card rail-goal-card">
        <span className="rail-icon"><Target size={18} /></span>
        <span className="eyebrow">Ranking goal</span>
        <h3>Find high-signal opportunities</h3>
        <p>{event.goal}</p>
        <button className="text-button" onClick={() => onNavigate("profile")}>Adjust goal <ChevronRight size={15} /></button>
      </section>
      <section className="rail-card">
        <div className="rail-card-heading"><span className="eyebrow">Today’s pulse</span><CalendarDays size={17} /></div>
        <div className="pulse-item"><span className="pulse-dot urgent" /><div><strong>2 drafts due</strong><small>Sarah and Marcus</small></div></div>
        <div className="pulse-item"><span className="pulse-dot" /><div><strong>1 contact incomplete</strong><small>Add an interaction note</small></div></div>
        <div className="pulse-item"><span className="pulse-dot quiet" /><div><strong>5 ranked contacts</strong><small>Evidence checked</small></div></div>
        <button className="secondary-button full-width" onClick={() => onNavigate("followups")}>Open follow-ups</button>
      </section>
      <section className="rail-card trust-card">
        <ShieldCheck size={20} />
        <div><strong>You stay in control</strong><p>Lodestar drafts and recommends. It never sends without you.</p></div>
      </section>
    </aside>
  );
}

function BriefingSheet({ contact, onClose, onToast }: { contact: Contact; onClose: () => void; onToast: (message: string) => void }) {
  const [language, setLanguage] = useState("English");
  const sheetRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const intro = language === "Mandarin"
    ? "你好，我是 Kee。我正在打造 Lodestar，帮助活动参与者把新联系人转化为清晰的下一步行动。"
    : language === "Bahasa"
      ? "Hai, saya Kee. Saya sedang membina Lodestar untuk membantu peserta acara menukar kenalan baharu kepada tindakan seterusnya yang jelas."
      : "Hi, I’m Kee. I’m building Lodestar to help event attendees turn new contacts into clear next actions.";

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    closeButtonRef.current?.focus();

    return () => {
      previouslyFocused?.focus();
    };
  }, []);

  async function copyIntro() {
    await navigator.clipboard?.writeText(intro);
    onToast(`${language} intro copied`);
  }

  function handleSheetKeyDown(eventValue: KeyboardEvent<HTMLElement>) {
    if (eventValue.key === "Escape") {
      eventValue.preventDefault();
      onClose();
      return;
    }

    if (eventValue.key !== "Tab") return;

    const focusableElements = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);

    if (focusableElements.length === 0) {
      eventValue.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (eventValue.shiftKey && activeElement === firstElement) {
      eventValue.preventDefault();
      lastElement.focus();
    } else if (!eventValue.shiftKey && activeElement === lastElement) {
      eventValue.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={sheetRef}
        className="briefing-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
        onKeyDown={handleSheetKeyDown}
        onMouseDown={(eventValue) => eventValue.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header className="sheet-header">
          <button ref={closeButtonRef} className="icon-button" onClick={onClose} aria-label="Close briefing"><X size={20} /></button>
          <span>Contact briefing</span>
          <button className="icon-button" aria-label="More options"><SlidersHorizontal size={19} /></button>
        </header>
        <div className="briefing-person">
          <Avatar contact={contact} size="large" />
          <div><h2 id="briefing-title">{contact.name}</h2><p>{contact.role} · {contact.company}</p><span className="opportunity-pill">{contact.opportunity}</span></div>
          <ScoreRing score={contact.score} />
        </div>
        <div className="briefing-confidence"><ShieldCheck size={15} /><strong>Evidence-checked briefing</strong><span>High confidence</span></div>
        <section className="briefing-section why-section">
          <span className="briefing-section-icon"><TrendingUp size={18} /></span>
          <div><span className="eyebrow">Why they matter</span><p>{contact.reason}</p></div>
        </section>
        <section className="briefing-section">
          <span className="briefing-section-icon"><Lightbulb size={18} /></span>
          <div><span className="eyebrow">Suggested opener</span><p className="quote-text">“{contact.opener}”</p><span className="suggestion-label">AI suggestion · Review before using</span></div>
        </section>
        <section className="briefing-section">
          <span className="briefing-section-icon"><MessageCircleQuestion size={18} /></span>
          <div className="full-section-content">
            <span className="eyebrow">Questions worth asking</span>
            <ol>{contact.questions.map((question) => <li key={question}>{question}</li>)}</ol>
          </div>
        </section>
        <section className="evidence-card">
          <div className="evidence-card-heading"><span><ShieldCheck size={16} /> Evidence used</span><small>{contact.evidence.length} signals</small></div>
          <ul>{contact.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        {contact.culturalNote && (
          <section className="cultural-note"><Languages size={18} /><div><strong>Language & tone</strong><p>{contact.culturalNote}</p></div></section>
        )}
        <section className="localise-card">
          <div className="localise-header"><div><span className="eyebrow">Your quick intro</span><h3>Say it naturally</h3></div><Languages size={19} /></div>
          <div className="language-tabs">
            {["English", "Mandarin", "Bahasa"].map((item) => <button key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>{item}</button>)}
          </div>
          <p>{intro}</p>
          <button className="secondary-button full-width" onClick={copyIntro}><Copy size={16} /> Copy intro</button>
        </section>
        <div className="sheet-actions">
          <button className="secondary-button"><PenLine size={17} /> Add meeting note</button>
          <button className="primary-button" onClick={() => onToast("Follow-up draft queued for review")}>Draft follow-up <ArrowRight size={17} /></button>
        </div>
      </section>
    </div>
  );
}

export function LodestarApp() {
  const [view, setView] = useState<View>("home");
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast("");
      toastTimerRef.current = null;
    }, 2600);
  }

  function addContact(contact: Contact) {
    setContacts((current) => [...current, contact]);
    showToast(`${contact.name} saved for review`);
    setView("contacts");
  }

  function openContactById(id: string) {
    const contact = contacts.find((item) => item.id === id);
    if (contact) setActiveContact(contact);
  }

  const page = view === "home"
    ? <Dashboard contacts={contacts} onOpenContact={setActiveContact} onNavigate={setView} />
    : view === "contacts"
      ? <ContactsView contacts={contacts} onOpenContact={setActiveContact} />
      : view === "capture"
        ? <CaptureView onAdd={addContact} />
        : view === "followups"
          ? <FollowupsView onOpenContact={openContactById} onToast={showToast} />
          : <ProfileView onToast={showToast} />;

  return (
    <div className="app-shell">
      <DesktopSidebar view={view} onNavigate={setView} />
      <main className={view === "home" ? "app-main" : "app-main app-main-wide"}>
        <div className="primary-content">{page}</div>
        {view === "home" && <InsightRail onNavigate={setView} />}
      </main>
      <MobileNav view={view} onNavigate={setView} />
      {activeContact && <BriefingSheet contact={activeContact} onClose={() => setActiveContact(null)} onToast={showToast} />}
      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
    </div>
  );
}
