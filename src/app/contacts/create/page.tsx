"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Compass, Loader2, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ContactDraft = {
  fullName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  websiteUrl: string;
  linkedinUrl: string;
  notes: string;
  confidence: number;
  warnings: string[];
};

const emptyDraft: ContactDraft = {
  fullName: "",
  title: "",
  company: "",
  email: "",
  phone: "",
  websiteUrl: "",
  linkedinUrl: "",
  notes: "",
  confidence: 0,
  warnings: [],
};

function parseFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function CreateContactPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "starting" | "ready" | "error">("idle");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft);

  function stopCamera(resetStatus = true) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (resetStatus) setCameraStatus("idle");
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setMessage("Webcam access is not available in this browser.");
      return;
    }

    setCameraStatus("starting");
    setMessage("");

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
      setMessage("Camera permission was blocked or no webcam was found.");
    }
  }

  async function runOcr(nextImageDataUrl: string) {
    setOcrStatus("reading");
    setMessage("");
    setImageDataUrl(nextImageDataUrl);

    try {
      const response = await fetch("/api/contact-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: nextImageDataUrl }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "OCR failed");
      }
      setDraft(payload.draft);
      setOcrStatus("ready");
    } catch (error) {
      setOcrStatus("error");
      setMessage(error instanceof Error ? error.message : "OCR failed");
    }
  }

  async function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      setMessage("Camera preview is still starting. Try again in a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    await runOcr(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    await runOcr(await parseFileAsDataUrl(file));
  }

  function updateDraft(field: keyof ContactDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    const pendingImage = window.sessionStorage.getItem("lodestar.pendingContactImage");
    if (pendingImage) {
      window.sessionStorage.removeItem("lodestar.pendingContactImage");
      void runOcr(pendingImage);
    }

    return () => stopCamera(false);
  }, []);

  useEffect(() => {
    if (cameraStatus !== "ready" || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      setCameraStatus("error");
      setMessage("Camera started, but the preview could not play.");
    });
  }, [cameraStatus]);

  return (
    <main className="min-h-dvh bg-[#ede6d5] text-[#191813]">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-3 font-black">
            <span className="grid size-10 place-items-center border border-[#191813] bg-[#d7ff51] text-[#191813] shadow-[3px_3px_0_rgba(25,24,19,0.28)]">
              <Compass size={21} strokeWidth={2.3} />
            </span>
            <span className="text-xl tracking-normal">Lodestar</span>
          </Link>
          <Link
            href="/dashboard"
            className="grid size-10 place-items-center border border-[#191813] bg-[#fffaf0] shadow-[3px_3px_0_rgba(25,24,19,0.16)]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
        </header>

        <div className="mb-6">
          <h1 className="text-4xl font-black tracking-normal sm:text-5xl">Create person</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section className="border border-[#191813] bg-[#191813] p-5 text-[#fffaf0] shadow-[6px_6px_0_rgba(25,24,19,0.18)]">
            <div className="relative grid aspect-[1.55/1] place-items-center overflow-hidden border border-[#fffaf0]/30 bg-[#fffaf0]/10">
              {cameraStatus === "ready" ? (
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  aria-label="Live webcam preview"
                />
              ) : imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageDataUrl} alt="Captured card" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Camera size={42} className="text-[#d7ff51]" />
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#191813] bg-[#d7ff51] px-4 py-3 text-sm font-black text-[#191813] shadow-[4px_4px_0_rgba(255,250,240,0.16)]"
                onClick={cameraStatus === "ready" ? captureFrame : startCamera}
                disabled={cameraStatus === "starting" || ocrStatus === "reading"}
              >
                {cameraStatus === "starting" || ocrStatus === "reading" ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}
                {cameraStatus === "ready" ? "Capture and read" : "Open camera"}
              </button>

              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-[#fffaf0]/25 bg-[#fffaf0]/10 px-4 py-3 text-sm font-black text-[#fffaf0]">
                <Upload size={17} />
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => void handleUpload(event.target.files?.[0])}
                />
              </label>
            </div>

            {message && <p className="mt-4 text-sm font-bold text-[#ff7c57]">{message}</p>}
            {ocrStatus === "ready" && (
              <p className="mt-4 text-sm font-bold text-[#d7ff51]">
                Draft populated. Review before saving.
              </p>
            )}
          </section>

          <section className="border border-[#191813] bg-[#fffaf0] p-5 shadow-[6px_6px_0_rgba(25,24,19,0.18)] sm:p-6">
            <form className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Full name
                  <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Role
                  <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold">
                Company
                <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.company} onChange={(event) => updateDraft("company", event.target.value)} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Email
                  <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Phone
                  <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Website
                  <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.websiteUrl} onChange={(event) => updateDraft("websiteUrl", event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  LinkedIn
                  <input className="border border-[#9f927a] bg-white px-3 py-3" value={draft.linkedinUrl} onChange={(event) => updateDraft("linkedinUrl", event.target.value)} />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold">
                Notes
                <textarea className="min-h-28 border border-[#9f927a] bg-white px-3 py-3" value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} />
              </label>

              {draft.warnings.length > 0 && (
                <div className="border border-[#d3c7ad] bg-[#f7f0df] p-4 text-sm font-bold text-[#555143]">
                  {draft.warnings.map((warning) => (
                    <p key={warning}>- {warning}</p>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#191813] bg-[#d7ff51] px-4 py-3 text-sm font-black shadow-[4px_4px_0_rgba(25,24,19,0.28)]"
                onClick={() => setMessage("Draft kept on this page for review. Database save comes next.")}
              >
                <Save size={17} />
                Save draft
              </button>
            </form>
          </section>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}
