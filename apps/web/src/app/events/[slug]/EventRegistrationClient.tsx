"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  supabase,
  EventItem,
  EventFormConfig,
  eventRegistrationSchema,
} from "@awssbg/shared";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineTicket,
  HiOutlineArrowRight,
} from "react-icons/hi2";

export default function EventRegistrationClient() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || "";

  const [event, setEvent] = useState<EventItem | null>(null);
  const [formConfig, setFormConfig] = useState<EventFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliationType, setAffiliationType] = useState<"student" | "industry">("student");
  const [affiliationDetail, setAffiliationDetail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [tshirtSize, setTshirtSize] = useState("L");
  const [dietary, setDietary] = useState("");
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});
  const [popiaConsent, setPopiaConsent] = useState(true);

  // Live registration count
  const [regCount, setRegCount] = useState(0);

  const fetchEventAndForm = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      // 1. Fetch Event
      const { data: eventData, error: eventErr } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (eventErr || !eventData) {
        setEvent(null);
        setLoading(false);
        return;
      }

      setEvent(eventData as EventItem);

      // 2. Fetch Form Config
      const { data: configData } = await supabase
        .from("event_forms")
        .select("*")
        .eq("event_id", eventData.id)
        .single();

      if (configData) {
        setFormConfig(configData as EventFormConfig);
      }

      // 3. Fetch count of active registrations
      const { count } = await supabase
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventData.id);

      setRegCount(count || 0);
    } catch (err) {
      console.error("Failed to load event:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEventAndForm();
  }, [fetchEventAndForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (!popiaConsent) {
      toast.error("Consent Required", {
        description: "You must accept the POPIA data processing terms to register for the event.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Validate schema
      const payload = {
        event_id: event.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        affiliation_type: affiliationType,
        affiliation_detail: affiliationDetail.trim(),
        student_id: formConfig?.include_student_id && studentId ? studentId.trim() : null,
        tshirt_size: formConfig?.include_tshirt_size ? tshirtSize : null,
        dietary_requirements: formConfig?.include_dietary && dietary ? dietary.trim() : null,
        custom_responses: customResponses,
        popia_consent_given: popiaConsent,
      };

      const parsed = eventRegistrationSchema.parse(payload);

      // Post to edge API to insert and trigger participant confirmation email
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const resData = await res.json();
      setSubmitted(true);
      toast.success(
        resData.status === "waitlisted"
          ? "Waitlist Application Recorded!"
          : "Registration Application Submitted!",
        {
          description: "Check your inbox for your application confirmation details.",
        }
      );
    } catch (err: any) {
      toast.error("Registration Failed", { description: err.message || "Please check your inputs and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin border-3 border-black border-t-[#7C3AED]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md border-[3px] border-black bg-white p-8 text-center shadow-[8px_8px_0px_#000000]">
            <div className="mb-2 inline-block border border-black bg-red-600 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
              // 404_EVENT_NOT_FOUND
            </div>
            <h1 className="text-2xl font-black uppercase text-black">Event Not Found</h1>
            <p className="mt-2 font-mono text-xs text-zinc-600">
              The event URL you navigated to does not exist or has been archived.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-[#7C3AED] transition-all"
            >
              Return to Community Hub &rarr;
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isAtCapacity = regCount >= event.capacity_limit;
  const isClosed = event.status === "registration_closed" || (isAtCapacity && !event.waitlist_enabled);

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col">
      <Header />

      <main className="flex-1 p-4 sm:p-6 md:py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Event Poster / Banner Hero */}
          <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_#7C3AED]">
                // AWS_COMMUNITY_EVENT
              </span>
              {isAtCapacity && event.waitlist_enabled && (
                <span className="border-2 border-black bg-purple-200 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black">
                  WAITLIST ACTIVE
                </span>
              )}
              {isClosed && (
                <span className="border-2 border-black bg-red-500 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                  REGISTRATION CLOSED
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-1 font-mono text-xs sm:text-sm font-semibold text-zinc-600">
                {event.subtitle}
              </p>
            )}

            {/* Event Meta Badges */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black bg-zinc-50 p-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-black">
                <HiOutlineMapPin className="h-4 w-4 text-[#7C3AED] shrink-0" />
                <span className="font-bold">{event.venue_name}</span>
              </div>
              <div className="flex items-center gap-2 text-black">
                <HiOutlineCalendar className="h-4 w-4 text-[#2563EB] shrink-0" />
                <span>
                  {new Date(event.start_time).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* ── SUCCESS VIEW: CONFIRMATION SCREEN ── */}
          {submitted ? (
            <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000] text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black bg-emerald-400 text-black shadow-[4px_4px_0px_#000000]">
                <HiOutlineCheckCircle className="h-10 w-10" />
              </div>
              <div className="inline-block border border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                // APPLICATION_LOGGED
              </div>
              <h2 className="text-2xl font-black uppercase text-black">
                Application Received!
              </h2>
              <p className="font-mono text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
                Thank you for applying to attend <strong>{event.title}</strong>. We have recorded your submission.
              </p>

              <div className="border-2 border-black bg-amber-50 p-4 text-left font-mono text-xs text-zinc-800 space-y-1">
                <div className="font-bold text-black uppercase mb-1">
                  Important Next Steps:
                </div>
                <div>&bull; This confirmation is <strong>NOT an entry pass</strong>.</div>
                <div>&bull; Our team reviews each application to allocate seating and keycards.</div>
                <div>&bull; Once approved, your official e-ticket pass with your <strong>Assigned Queue Line (1–4)</strong> and QR code will be emailed to <strong>{email}</strong>.</div>
              </div>

              <div className="pt-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-5 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-[#7C3AED] transition-all cursor-pointer"
                >
                  <span>Return to Community Hub</span>
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : isClosed ? (
            <div className="border-[3px] border-black bg-white p-8 text-center shadow-[6px_6px_0px_#000000]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-2 border-black bg-red-500 text-white">
                <HiOutlineExclamationTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black uppercase text-black">Registration Closed</h2>
              <p className="font-mono text-xs text-zinc-600 mt-2">
                This event has reached full seating capacity and registration is now closed. Follow our WhatsApp community for future Study Jams and summits.
              </p>
            </div>
          ) : (
            /* ── REGISTRATION FORM ── */
            <form onSubmit={handleSubmit} className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-5">
              <div className="border-b-2 border-black pb-3">
                <div className="font-mono text-[9px] font-black uppercase text-[#7C3AED]">
                  // ATTENDEE_REGISTRATION
                </div>
                <h2 className="text-xl font-black uppercase text-black">
                  Reserve Your Seat
                </h2>
                <p className="font-mono text-xs text-zinc-500 mt-0.5">
                  Official badge registration for students, cloud builders, and professionals.
                </p>
              </div>

              {/* Core Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                  Email Address * (E-Ticket Destination)
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@tut.ac.za or name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                />
              </div>

              {/* Affiliation Mode Toggle (Student vs Industry) */}
              <div className="border-2 border-black bg-zinc-50 p-3.5 space-y-3">
                <label className="block font-mono text-xs font-black uppercase text-black">
                  Current Profile / Affiliation *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAffiliationType("student")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                      affiliationType === "student"
                        ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                        : "bg-white text-black hover:bg-zinc-100"
                    }`}
                  >
                    <HiOutlineAcademicCap className="h-4 w-4" />
                    <span>University Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffiliationType("industry")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-xs font-black uppercase border-2 border-black cursor-pointer transition-all ${
                      affiliationType === "industry"
                        ? "bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                        : "bg-white text-black hover:bg-zinc-100"
                    }`}
                  >
                    <HiOutlineBriefcase className="h-4 w-4" />
                    <span>Industry Professional</span>
                  </button>
                </div>

                <div>
                  <label className="block font-mono text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    {affiliationType === "student"
                      ? "Course of Study & Year (e.g. Diploma in Computer Science - 2nd Year):"
                      : "Job Title & Company / Organization (e.g. Cloud Solutions Architect at AWS):"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      affiliationType === "student"
                        ? "e.g. BTech Computer Systems Engineering, 3rd Year"
                        : "e.g. DevOps Engineer, FinTech Corp"
                    }
                    value={affiliationDetail}
                    onChange={(e) => setAffiliationDetail(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                  />
                </div>
              </div>

              {/* Student ID Number (if enabled) */}
              {formConfig?.include_student_id && affiliationType === "student" && (
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    Student ID Number (Optional / Venue Verification)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 220194829"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                  />
                </div>
              )}

              {/* T-Shirt Size & Dietary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formConfig?.include_tshirt_size && (
                  <div>
                    <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                      Event T-Shirt Size
                    </label>
                    <select
                      value={tshirtSize}
                      onChange={(e) => setTshirtSize(e.target.value)}
                      className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-black cursor-pointer"
                    >
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                      <option value="2XL">Double XL (2XL)</option>
                    </select>
                  </div>
                )}

                {formConfig?.include_dietary && (
                  <div>
                    <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                      Dietary Requirements
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Halal, Vegetarian, None"
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                    />
                  </div>
                )}
              </div>

              {/* Custom Questions */}
              {formConfig?.custom_fields && formConfig.custom_fields.length > 0 && (
                <div className="border-t-2 border-black/10 pt-4 space-y-4">
                  {formConfig.custom_fields.map((q) => (
                    <div key={q.id}>
                      <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                        {q.label} {q.required && "*"}
                      </label>
                      {q.type === "textarea" ? (
                        <textarea
                          required={q.required}
                          rows={3}
                          value={customResponses[q.id] || ""}
                          onChange={(e) =>
                            setCustomResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-full border-2 border-black bg-white p-2 font-mono text-xs text-black outline-none"
                        />
                      ) : q.type === "select" ? (
                        <select
                          required={q.required}
                          value={customResponses[q.id] || ""}
                          onChange={(e) =>
                            setCustomResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-full border-2 border-black bg-white p-2 font-mono text-xs font-bold text-black"
                        >
                          <option value="">-- Select option --</option>
                          {q.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required={q.required}
                          value={customResponses[q.id] || ""}
                          onChange={(e) =>
                            setCustomResponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mandatory POPIA Privacy & Sponsor Consent Checkbox */}
              <div className="border-2 border-black bg-zinc-100 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popiaConsent}
                    onChange={(e) => setPopiaConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 border-2 border-black cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-zinc-800 leading-relaxed">
                    <strong>POPIA Consent:</strong> {formConfig?.popia_consent_text || "I consent to having my professional contact info shared with official event sponsors upon badge scan at their booths in accordance with POPIA. I understand that my Student ID and dietary info will strictly never be shared."}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full border-2 border-black bg-black py-3.5 font-mono text-xs font-black uppercase text-white shadow-[4px_4px_0px_#7C3AED] hover:bg-[#7C3AED] transition-all cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {submitting
                  ? "Submitting Application..."
                  : isAtCapacity
                  ? "Submit Waitlist Application →"
                  : "Submit Event Application →"}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
