"use client";

import Link from "next/link";
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

const DEMO_EVENT_ID = process.env.NEXT_PUBLIC_DEMO_EVENT_ID ?? "cle00000000000000000001";

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

type FollowUpDraft = (typeof followUps)[number];

type ProfileState = {
  displayName: string;
  title: string;
  company: string;
  bio: string;
  websiteUrl: string;
  linkedinUrl: string;
  networkingGoal: string;
  languages: string;
  tone: string;
};

type ProfileDraft = ProfileState & {
  warnings: string[];
};

const initialProfile: ProfileState = {
  displayName: "Kee Zhen Xian",
  title: "Founder",
  company: "Lodestar",
  bio: "Building Lodestar for event networking follow-through.",
  websiteUrl: "",
  linkedinUrl: "",
  networkingGoal: event.goal,
  languages: "English",
  tone: "Concise and warm",
};

function profileInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ME";
}

function buildProfileDraft({
  currentProfile,
  sourceText,
  sourceUrl,
  fileName,
}: {
  currentProfile: ProfileState;
  sourceText: string;
  sourceUrl: string;
  fileName: string;
}): ProfileDraft {
  const warnings: string[] = [];
  const text = sourceText.replace(/\s+/g, " ").trim();
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const url = sourceUrl.trim();
  const isLinkedIn = /linkedin\.com\/(in|pub)\//i.test(url);
  const websiteUrl = url && !isLinkedIn ? url : currentProfile.websiteUrl;
  const linkedinUrl = isLinkedIn ? url : currentProfile.linkedinUrl;
  const likelyName = lines.find((line) =>
    /^[A-Z][A-Za-z .'-]+$/.test(line) &&
    line.split(/\s+/).length >= 2 &&
    line.split(/\s+/).length <= 5,
  );
  const likelyTitleLine = lines.find((line) =>
    /\b(founder|engineer|developer|designer|product|manager|director|lead|consultant|student|researcher)\b/i.test(line),
  );
  const likelyCompany = likelyTitleLine?.match(/\bat\s+(.+)$/i)?.[1]
    ?? lines.find((line) => /\b(inc|labs|studio|ventures|capital|university|group|systems|ai)\b/i.test(line));
  const languageMatches = Array.from(
    text.matchAll(/\b(English|Mandarin|Chinese|Malay|Bahasa|Tamil|Japanese|Korean|French|Spanish|German)\b/gi),
  ).map((match) => match[1]);
  const goalLine = lines.find((line) =>
    /\b(goal|seeking|looking for|interested in|want to|building|fundraising|pilot|partner|collaborat)/i.test(line),
  );

  if (fileName.toLowerCase().endsWith(".pdf")) {
    warnings.push("PDF text extraction is best-effort in this browser. Review every field before applying.");
  }

  if (isLinkedIn) {
    warnings.push("LinkedIn URL was stored from your input. Lodestar did not scrape LinkedIn.");
  }

  if (url && !isLinkedIn && !/^https?:\/\//i.test(url)) {
    warnings.push("Website links should include https:// for production use.");
  }

  return {
    displayName: likelyName ?? currentProfile.displayName,
    title: likelyTitleLine?.replace(/\s+at\s+.+$/i, "") ?? currentProfile.title,
    company: likelyCompany ?? currentProfile.company,
    bio: text ? text.slice(0, 360) : currentProfile.bio,
    websiteUrl,
    linkedinUrl,
    networkingGoal: goalLine ?? currentProfile.networkingGoal,
    languages: languageMatches.length > 0
      ? Array.from(new Set(languageMatches.map((item) => item[0].toUpperCase() + item.slice(1).toLowerCase()))).join(", ")
      : currentProfile.languages,
    tone: currentProfile.tone,
    warnings,
  };
}

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

function DesktopSidebar({
  profile,
  view,
  onNavigate,
}: {
  profile: ProfileState;
  view: View;
  onNavigate: (view: View) => void;
}) {
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
      <Link href={`/events/${DEMO_EVENT_ID}`} className="sidebar-event" aria-label={`Open ${event.name}`}>
        <strong>{event.name}</strong>
      </Link>
      <div className="sidebar-profile">
        <span className="profile-avatar">{profileInitials(profile.displayName)}</span>
        <span>
          <strong>{profile.displayName}</strong>
          <small>{profile.title} · {profile.company}</small>
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
        <p>{contact.reason}</p>
      </div>
      <div className="next-action-row">
        <span className="next-action-icon"><ArrowRight size={16} /></span>
        <div>
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
          <h1>Good afternoon, Kee.</h1>
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
        <h1>Know who matters<br />before the moment cools.</h1>
      </section>

      <section className="metrics-strip" aria-label="Event summary">
        <div><strong>17</strong><span>contacts</span></div>
        <div><strong>5</strong><span>priority</span></div>
        <div><strong>3</strong><span>due now</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <h2>Best next move</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("contacts")}>See all</button>
        </div>
        <PriorityContact contact={rankedContacts[0]} onOpen={() => onOpenContact(rankedContacts[0])} />
      </section>

      <section className="section-block">
        <div className="section-heading compact-heading">
          <div>
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
          <h1>People</h1>
        </div>
        <Link className="round-add-button" href="/contacts/create" aria-label="Add contact">
          <Plus size={21} />
        </Link>
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
  const [cameraStatus, setCameraStatus] = useState<"idle" | "starting" | "ready" | "error">("idle");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera(resetStatus = true) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (resetStatus) {
      setCameraStatus("idle");
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setCameraError("Webcam access is not available in this browser.");
      return;
    }

    setCameraStatus("starting");
    setCameraError("");

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
    } catch {
      setCameraStatus("error");
      setCameraError("Camera permission was blocked or no webcam was found.");
    }
  }

  function captureFrameForDraft() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("Camera preview is still starting. Try again in a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    window.sessionStorage.setItem("lodestar.pendingContactImage", canvas.toDataURL("image/jpeg", 0.9));
    window.location.assign("/contacts/create");
  }

  useEffect(() => {
    if (mode !== "scan") {
      stopCamera();
    }
  }, [mode]);

  useEffect(() => {
    if (cameraStatus !== "ready" || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      setCameraStatus("error");
      setCameraError("Camera started, but the preview could not play.");
    });
  }, [cameraStatus]);

  useEffect(() => () => stopCamera(false), []);

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
          <h1>Capture contact</h1>
        </div>
      </div>
      <div className="segmented-control capture-tabs" role="group" aria-label="Capture method">
        <button className={mode === "scan" ? "active" : ""} onClick={() => setMode("scan")}>Scan or import</button>
        <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Manual entry</button>
      </div>

      {mode === "scan" ? (
        <>
          <section className="camera-card">
            <div className="camera-frame">
              <span className="camera-corner top-left" />
              <span className="camera-corner top-right" />
              <span className="camera-corner bottom-left" />
              <span className="camera-corner bottom-right" />
              {cameraStatus === "ready" ? (
                <video
                  ref={videoRef}
                  className="camera-preview"
                  autoPlay
                  muted
                  playsInline
                  aria-label="Live webcam preview"
                />
              ) : (
                <Camera size={40} aria-hidden="true" />
              )}
            </div>
            <h2>Point, capture, confirm.</h2>
            {cameraStatus === "error" && <p className="camera-error">{cameraError}</p>}
            <button
              type="button"
              className="primary-button camera-button"
              onClick={cameraStatus === "ready" ? captureFrameForDraft : startCamera}
              disabled={cameraStatus === "starting"}
            >
              <Camera size={18} />
              {cameraStatus === "starting"
                ? "Opening camera"
                : cameraStatus === "ready"
                  ? "Capture and draft"
                  : "Open camera"}
            </button>
            {cameraStatus === "ready" && (
              <button type="button" className="secondary-button camera-upload-button" onClick={() => stopCamera()}>
                Close camera
              </button>
            )}
            <label className="secondary-button camera-upload-button">
              Upload image
              <input type="file" accept="image/*" capture="environment" aria-label="Photograph business card" />
            </label>
            <span className="privacy-note"><ShieldCheck size={14} /> Image is discarded after extraction by default</span>
          </section>
          <div className="capture-options">
            <label className="capture-option">
              <span className="capture-option-icon"><QrCode size={21} /></span>
              <span><strong>Scan QR code</strong></span>
              <ChevronRight size={18} />
              <input type="file" accept="image/*" capture="environment" aria-label="Scan QR code" />
            </label>
            <label className="capture-option">
              <span className="capture-option-icon"><FileUp size={21} /></span>
              <span><strong>Import contact file</strong></span>
              <ChevronRight size={18} />
              <input type="file" accept=".vcf,text/vcard" aria-label="Import VCF contact file" />
            </label>
            <button className="capture-option" onClick={() => setMode("manual")}>
              <span className="capture-option-icon"><PenLine size={21} /></span>
              <span><strong>Paste profile details</strong></span>
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      ) : (
        <form className="manual-form" onSubmit={submitManual}>
          <div className="form-intro">
            <span className="form-icon"><PenLine size={22} /></span>
            <div><h2>Add the essentials</h2></div>
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
      <canvas ref={canvasRef} hidden />
    </div>
  );
}

function FollowupsView({
  followUpDrafts,
  selectedDraftId,
  onOpenContact,
  onToast,
}: {
  followUpDrafts: FollowUpDraft[];
  selectedDraftId: string;
  onOpenContact: (id: string) => void;
  onToast: (message: string) => void;
}) {
  const [selected, setSelected] = useState(followUpDrafts[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(followUpDrafts.map((item) => [item.id, item.draft])),
  );
  const [approved, setApproved] = useState<string[]>([]);
  const active = followUpDrafts.find((item) => item.id === selected) ?? followUpDrafts[0];

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const item of followUpDrafts) {
        if (!(item.id in next)) {
          next[item.id] = item.draft;
        }
      }
      return next;
    });

    if (!selected || !followUpDrafts.some((item) => item.id === selected)) {
      setSelected(followUpDrafts[0]?.id ?? "");
    }
  }, [followUpDrafts, selected]);

  useEffect(() => {
    if (selectedDraftId && followUpDrafts.some((item) => item.id === selectedDraftId)) {
      setSelected(selectedDraftId);
    }
  }, [followUpDrafts, selectedDraftId]);

  if (!active) {
    return (
      <div className="view-stack standard-view followups-view">
        <ShellHeader title="Follow-ups" />
        <div className="empty-state">
          <MessageSquareText size={24} />
          <strong>No drafts yet</strong>
          <span>Open a contact briefing and draft a follow-up.</span>
        </div>
      </div>
    );
  }

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
          <h1>Follow-ups</h1>
        </div>
      </div>
      <div className="followup-summary">
        <div><Clock3 size={19} /><span><strong>{followUpDrafts.length}</strong> drafts</span></div>
        <div><CircleCheck size={19} /><span><strong>{approved.length}</strong> approved</span></div>
      </div>
      <section className="followup-list">
        <div className="section-heading compact-heading">
          <div><h2>Drafts to finish</h2></div>
        </div>
        {followUpDrafts.map((item) => (
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

function ProfileView({
  profile,
  onProfileChange,
  onToast,
}: {
  profile: ProfileState;
  onProfileChange: (profile: ProfileState) => void;
  onToast: (message: string) => void;
}) {
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState(profile.linkedinUrl || profile.websiteUrl);
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);

  async function handleSourceFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setSourceText(await file.text());
  }

  function generateDraft() {
    const nextDraft = buildProfileDraft({
      currentProfile: profile,
      sourceText,
      sourceUrl,
      fileName,
    });
    setDraft(nextDraft);
    onToast("Profile draft ready for review");
  }

  function applyDraft() {
    if (!draft) return;
    onProfileChange({
      displayName: draft.displayName,
      title: draft.title,
      company: draft.company,
      bio: draft.bio,
      websiteUrl: draft.websiteUrl,
      linkedinUrl: draft.linkedinUrl,
      networkingGoal: draft.networkingGoal,
      languages: draft.languages,
      tone: draft.tone,
    });
    setDraft(null);
    onToast("Profile updated locally");
  }

  function updateProfile(field: keyof ProfileState, value: string) {
    onProfileChange({ ...profile, [field]: value });
  }

  return (
    <div className="view-stack standard-view profile-view">
      <ShellHeader title="Profile" />
      <div className="profile-hero">
        <span className="profile-avatar profile-avatar-large">{profileInitials(profile.displayName)}</span>
        <h1>{profile.displayName}</h1>
        <p>{profile.title} · {profile.company}</p>
      </div>

      <section className="settings-section profile-ingest-section">
        <h2>Resume, website, or LinkedIn</h2>
        <div className="profile-source-grid">
          <label className="profile-source-upload">
            <FileUp size={20} />
            <span><strong>{fileName || "Upload resume/CV"}</strong><small>PDF, TXT, or Markdown</small></span>
            <input
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              onChange={(eventValue) => void handleSourceFile(eventValue.target.files?.[0])}
            />
          </label>
          <label className="profile-source-field">
            Personal site or LinkedIn
            <input
              value={sourceUrl}
              onChange={(eventValue) => setSourceUrl(eventValue.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>
        <label className="profile-source-field">
          Paste resume, bio, or profile text
          <textarea
            value={sourceText}
            onChange={(eventValue) => setSourceText(eventValue.target.value)}
            rows={5}
            placeholder="Paste your profile, CV text, goals, preferred roles, languages, or what you are looking for."
          />
        </label>
        <button className="primary-button full-width" onClick={generateDraft}>
          Generate profile draft <ArrowRight size={17} />
        </button>
        {draft && (
          <div className="profile-draft-card">
            <div className="section-heading compact-heading">
              <div><h2>Review draft</h2></div>
            </div>
            <div className="profile-draft-grid">
              <label>Display name<input value={draft.displayName} onChange={(eventValue) => setDraft({ ...draft, displayName: eventValue.target.value })} /></label>
              <label>Role<input value={draft.title} onChange={(eventValue) => setDraft({ ...draft, title: eventValue.target.value })} /></label>
              <label>Company<input value={draft.company} onChange={(eventValue) => setDraft({ ...draft, company: eventValue.target.value })} /></label>
              <label>Languages<input value={draft.languages} onChange={(eventValue) => setDraft({ ...draft, languages: eventValue.target.value })} /></label>
              <label>Website<input value={draft.websiteUrl} onChange={(eventValue) => setDraft({ ...draft, websiteUrl: eventValue.target.value })} /></label>
              <label>LinkedIn<input value={draft.linkedinUrl} onChange={(eventValue) => setDraft({ ...draft, linkedinUrl: eventValue.target.value })} /></label>
            </div>
            <label className="profile-draft-field">Networking goal<textarea value={draft.networkingGoal} onChange={(eventValue) => setDraft({ ...draft, networkingGoal: eventValue.target.value })} rows={3} /></label>
            <label className="profile-draft-field">Bio<textarea value={draft.bio} onChange={(eventValue) => setDraft({ ...draft, bio: eventValue.target.value })} rows={4} /></label>
            {draft.warnings.length > 0 && (
              <div className="draft-safety">
                <ShieldCheck size={15} />
                <span>{draft.warnings.join(" ")}</span>
              </div>
            )}
            <button className="primary-button full-width" onClick={applyDraft}>
              Apply to profile <Check size={17} />
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2>Networking goal</h2>
        <label className="goal-field">
          <Target size={19} />
          <textarea
            value={profile.networkingGoal}
            onChange={(eventValue) => updateProfile("networkingGoal", eventValue.target.value)}
            rows={3}
          />
        </label>
        <button className="primary-button full-width" onClick={() => onToast("Networking goal updated locally")}>
          Save goal <Check size={17} />
        </button>
      </section>
      <section className="settings-section settings-list">
        <button><Languages size={19} /><span><strong>Language & tone</strong></span><ChevronRight size={17} /></button>
        <button><ShieldCheck size={19} /><span><strong>Privacy controls</strong></span><ChevronRight size={17} /></button>
        <button><Database size={19} /><span><strong>Relationship memory</strong></span><ChevronRight size={17} /></button>
        <button><Download size={19} /><span><strong>Export my data</strong></span><ChevronRight size={17} /></button>
        <button className="danger-row"><Trash2 size={19} /><span><strong>Delete account data</strong></span><ChevronRight size={17} /></button>
      </section>
    </div>
  );
}

function InsightRail({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <aside className="insight-rail">
      <section className="rail-card">
        <div className="rail-card-heading"><CalendarDays size={17} /></div>
        <div className="pulse-item"><span className="pulse-dot urgent" /><div><strong>2 drafts due</strong></div></div>
        <div className="pulse-item"><span className="pulse-dot" /><div><strong>1 contact incomplete</strong></div></div>
        <div className="pulse-item"><span className="pulse-dot quiet" /><div><strong>5 ranked contacts</strong></div></div>
        <button className="secondary-button full-width" onClick={() => onNavigate("followups")}>Open follow-ups</button>
      </section>
      <section className="rail-card trust-card">
        <ShieldCheck size={20} />
        <div><strong>You stay in control</strong></div>
      </section>
    </aside>
  );
}

function BriefingSheet({
  contact,
  onClose,
  onDraftFollowUp,
  onToast,
}: {
  contact: Contact;
  onClose: () => void;
  onDraftFollowUp: (contact: Contact) => void;
  onToast: (message: string) => void;
}) {
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
          <div><p>{contact.reason}</p></div>
        </section>
        <section className="briefing-section">
          <span className="briefing-section-icon"><Lightbulb size={18} /></span>
          <div><p className="quote-text">“{contact.opener}”</p></div>
        </section>
        <section className="briefing-section">
          <span className="briefing-section-icon"><MessageCircleQuestion size={18} /></span>
          <div className="full-section-content">
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
          <div className="localise-header"><div><h3>Say it naturally</h3></div><Languages size={19} /></div>
          <div className="language-tabs">
            {["English", "Mandarin", "Bahasa"].map((item) => <button key={item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>{item}</button>)}
          </div>
          <p>{intro}</p>
          <button className="secondary-button full-width" onClick={copyIntro}><Copy size={16} /> Copy intro</button>
        </section>
        <div className="sheet-actions">
          <button className="secondary-button"><PenLine size={17} /> Add meeting note</button>
          <button className="primary-button" onClick={() => onDraftFollowUp(contact)}>Draft follow-up <ArrowRight size={17} /></button>
        </div>
      </section>
    </div>
  );
}

export function LodestarApp() {
  const [view, setView] = useState<View>("home");
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [followUpDrafts, setFollowUpDrafts] = useState<FollowUpDraft[]>(followUps);
  const [selectedDraftId, setSelectedDraftId] = useState(followUps[0]?.id ?? "");
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
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

  function draftFollowUp(contact: Contact) {
    const draft: FollowUpDraft = {
      id: `draft-${contact.id}`,
      contactId: contact.id,
      name: contact.name,
      company: contact.company,
      due: "Today",
      channel: "Email",
      draft: `${contact.name.split(" ")[0]}, ${contact.opener} ${contact.nextAction}`,
    };

    setFollowUpDrafts((current) => {
      const existingIndex = current.findIndex((item) => item.contactId === contact.id);
      if (existingIndex === -1) {
        return [draft, ...current];
      }

      return current.map((item, index) => index === existingIndex ? draft : item);
    });
    setSelectedDraftId(draft.id);
    setActiveContact(null);
    setView("followups");
    showToast(`Follow-up draft added for ${contact.name}`);
  }

  const page = view === "home"
    ? <Dashboard contacts={contacts} onOpenContact={setActiveContact} onNavigate={setView} />
    : view === "contacts"
      ? <ContactsView contacts={contacts} onOpenContact={setActiveContact} />
      : view === "capture"
        ? <CaptureView onAdd={addContact} />
        : view === "followups"
          ? (
              <FollowupsView
                followUpDrafts={followUpDrafts}
                selectedDraftId={selectedDraftId}
                onOpenContact={openContactById}
                onToast={showToast}
              />
            )
          : <ProfileView profile={profile} onProfileChange={setProfile} onToast={showToast} />;

  return (
    <div className="app-shell">
      <DesktopSidebar profile={profile} view={view} onNavigate={setView} />
      <main className={view === "home" ? "app-main" : "app-main app-main-wide"}>
        <div className="primary-content">{page}</div>
        {view === "home" && <InsightRail onNavigate={setView} />}
      </main>
      <MobileNav view={view} onNavigate={setView} />
      {activeContact && (
        <BriefingSheet
          contact={activeContact}
          onClose={() => setActiveContact(null)}
          onDraftFollowUp={draftFollowUp}
          onToast={showToast}
        />
      )}
      {toast && <div className="toast" role="status"><Check size={17} /> {toast}</div>}
    </div>
  );
}
