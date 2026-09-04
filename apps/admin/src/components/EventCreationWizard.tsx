"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { supabase, logActivity, EventCustomField } from "@awssbg/shared";
import {
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineTicket,
  HiOutlineBuildingOffice,
  HiOutlineShieldCheck,
  HiPlus,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineXMark,
} from "react-icons/hi2";

interface EventCreationWizardProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export function EventCreationWizard({
  currentOrgId,
  actorId,
  actorName,
  token,
  isOpen,
  onClose,
  onEventCreated,
}: EventCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // STEP 1: BASICS
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [venueName, setVenueName] = useState("TUT Main Campus, Pretoria");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacityLimit, setCapacityLimit] = useState(500);
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);

  // STEP 2: FORM CONFIG
  const [includeStudentId, setIncludeStudentId] = useState(true);
  const [includeTshirtSize, setIncludeTshirtSize] = useState(true);
  const [includeDietary, setIncludeDietary] = useState(true);
  const [popiaConsentText, setPopiaConsentText] = useState(
    "I consent to having my professional contact info shared with official event sponsors upon badge scan at their booths in accordance with POPIA. I understand my Student ID and dietary info will strictly never be shared."
  );
  const [customFields, setCustomFields] = useState<EventCustomField[]>([]);

  // STEP 3: QUEUE RULES
  const [queueCount, setQueueCount] = useState(4);

  // STEP 4: SPONSORS
  const [sponsorsList, setSponsorsList] = useState<Array<{ name: string; tier: string }>>([
    { name: "Amazon Web Services", tier: "title" },
  ]);
  const [sponsorNameInput, setSponsorNameInput] = useState("");
  const [sponsorTierInput, setSponsorTierInput] = useState("platinum");

  // STEP 5: STAFF VOLUNTEERS
  const [staffList, setStaffList] = useState<Array<{ email: string; name: string }>>([]);
  const [staffEmailInput, setStaffEmailInput] = useState("");
  const [staffNameInput, setStaffNameInput] = useState("");

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        label: "New Question",
        type: "text",
        required: false,
      },
    ]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const addSponsor = () => {
    if (!sponsorNameInput.trim()) return;
    setSponsorsList((prev) => [
      ...prev,
      { name: sponsorNameInput.trim(), tier: sponsorTierInput },
    ]);
    setSponsorNameInput("");
  };

  const removeSponsor = (index: number) => {
    setSponsorsList((prev) => prev.filter((_, i) => i !== index));
  };

  const addStaff = () => {
    if (!staffEmailInput.trim()) return;
    setStaffList((prev) => [
      ...prev,
      { email: staffEmailInput.trim().toLowerCase(), name: staffNameInput.trim() || staffEmailInput.split("@")[0] },
    ]);
    setStaffEmailInput("");
    setStaffNameInput("");
  };

  const removeStaff = (index: number) => {
    setStaffList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    if (!title.trim() || !slug.trim() || !venueName.trim() || !startTime || !endTime) {
      toast.error("Please complete all required fields in Step 1.");
      setCurrentStep(1);
      return;
    }

    setLoading(true);

    try {
      // 1. Create Event in public.events
      const { data: newEvent, error: eventErr } = await supabase
        .from("events")
        .insert({
          org_id: currentOrgId,
          slug: slug.trim(),
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          venue_name: venueName.trim(),
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          capacity_limit: Number(capacityLimit),
          waitlist_enabled: waitlistEnabled,
          queue_count: Number(queueCount),
          status: "published_open",
        })
        .select()
        .single();

      if (eventErr) throw eventErr;

      // 2. Create Event Form in public.event_forms
      const { error: formErr } = await supabase.from("event_forms").insert({
        event_id: newEvent.id,
        include_student_id: includeStudentId,
        include_tshirt_size: includeTshirtSize,
        include_dietary: includeDietary,
        custom_fields: customFields,
        popia_consent_text: popiaConsentText.trim(),
      });

      if (formErr) throw formErr;

      // 3. Add Sponsors
      if (sponsorsList.length > 0) {
        await supabase.from("sponsor_companies").insert(
          sponsorsList.map((s) => ({
            event_id: newEvent.id,
            name: s.name,
            tier: s.tier,
          }))
        );
      }

      // 4. Invite Staff Volunteers
      if (staffList.length > 0) {
        for (const staff of staffList) {
          fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              event_id: newEvent.id,
              email: staff.email,
              name: staff.name,
              role: "event_staff",
            }),
          }).catch((e) => console.error("Staff invite error:", e));
        }
      }

      // 5. Log Activity
      await logActivity(supabase, {
        org_id: currentOrgId,
        actor_id: actorId,
        actor_name: actorName,
        action: "CREATE_EVENT",
        entity_type: "announcement",
        entity_id: newEvent.id,
        summary: `Created event "${title}" with capacity ${capacityLimit} and 4-line queue balancer`,
      });

      toast.success("Event Created Successfully!", {
        description: `Registration is now live at https://awssbg.online/events/${slug}`,
      });

      onEventCreated();
      onClose();
    } catch (err: any) {
      toast.error("Failed to create event", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col border-[4px] border-black bg-white shadow-[10px_10px_0px_#000000]">
        {/* Modal Header */}
        <div className="border-b-[3px] border-black bg-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="mb-1 inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black uppercase text-white">
              // EVENT_WIZARD // STEP_{currentStep}_OF_5
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              New Community Event Onboarding
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black bg-zinc-100 p-1.5 hover:bg-zinc-200 cursor-pointer"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-5 border-b-2 border-black bg-zinc-100 font-mono text-[10px] font-black uppercase text-center">
          <div className={`py-2 border-r border-black ${currentStep === 1 ? "bg-black text-white" : ""}`}>
            1. Basics
          </div>
          <div className={`py-2 border-r border-black ${currentStep === 2 ? "bg-black text-white" : ""}`}>
            2. Form
          </div>
          <div className={`py-2 border-r border-black ${currentStep === 3 ? "bg-black text-white" : ""}`}>
            3. Queues
          </div>
          <div className={`py-2 border-r border-black ${currentStep === 4 ? "bg-black text-white" : ""}`}>
            4. Sponsors
          </div>
          <div className={`py-2 ${currentStep === 5 ? "bg-black text-white" : ""}`}>
            5. Staff
          </div>
        </div>

        {/* Wizard Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* ── STEP 1: BASICS ── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Student Community Day 2026"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    URL Slug (awssbg.online/events/...) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="aws-student-community-day-2026"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full border-2 border-black bg-zinc-50 px-3 py-2 font-mono text-xs text-black outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    Venue / Campus Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TUT Main Campus, Prestige Hall"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                  Subtitle / Theme
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Practitioner prep, architecture jams, and student networking"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    Start Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    End Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-2 border-black bg-zinc-50 p-3">
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                    Capacity Limit (Max Attendees)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={capacityLimit}
                    onChange={(e) => setCapacityLimit(Number(e.target.value))}
                    className="w-full border-2 border-black bg-white px-3 py-1.5 font-mono text-xs text-black outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waitlistEnabled}
                      onChange={(e) => setWaitlistEnabled(e.target.checked)}
                      className="h-4 w-4 border-2 border-black cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-black uppercase">
                      Enable Waitlist Once Capacity is Reached
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: FORM BUILDER ── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-zinc-50 p-3 space-y-2">
                <span className="font-mono text-xs font-black uppercase text-black block mb-2">
                  Standard Attendee Fields:
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={includeStudentId}
                    onChange={(e) => setIncludeStudentId(e.target.checked)}
                  />
                  <span>Include Student ID / Registration Number field</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={includeTshirtSize}
                    onChange={(e) => setIncludeTshirtSize(e.target.checked)}
                  />
                  <span>Include Event T-Shirt Size selector</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={includeDietary}
                    onChange={(e) => setIncludeDietary(e.target.checked)}
                  />
                  <span>Include Dietary Requirements field</span>
                </label>
              </div>

              {/* Dynamic Custom Questions */}
              <div className="border-2 border-black bg-white p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase text-black">
                    Custom Questions ({customFields.length})
                  </span>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="flex items-center gap-1 border border-black bg-black px-2.5 py-1 font-mono text-[10px] font-black uppercase text-white shadow-[1px_1px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
                  >
                    <HiPlus className="h-3 w-3" /> Add Question
                  </button>
                </div>

                {customFields.map((field, idx) => (
                  <div key={field.id} className="border border-black bg-zinc-50 p-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Question label..."
                      value={field.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomFields((prev) =>
                          prev.map((f) => (f.id === field.id ? { ...f, label: val } : f))
                        );
                      }}
                      className="flex-1 border border-black bg-white px-2 py-1 font-mono text-xs text-black"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setCustomFields((prev) =>
                          prev.map((f) => (f.id === field.id ? { ...f, type: val } : f))
                        );
                      }}
                      className="border border-black bg-white px-2 py-1 font-mono text-xs cursor-pointer"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Paragraph</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <label className="flex items-center gap-1 font-mono text-[10px] font-bold">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setCustomFields((prev) =>
                            prev.map((f) => (f.id === field.id ? { ...f, required: val } : f))
                          );
                        }}
                      />
                      Req
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="text-red-600 p-1 hover:bg-red-50 border border-black"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* POPIA Disclosure Text */}
              <div>
                <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                  POPIA Consent Notice (Rendered on Form)
                </label>
                <textarea
                  rows={2}
                  value={popiaConsentText}
                  onChange={(e) => setPopiaConsentText(e.target.value)}
                  className="w-full border-2 border-black bg-white p-2 font-mono text-xs text-black outline-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: QUEUE BALANCER SETUP ── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-zinc-50 p-4">
                <h3 className="font-mono text-sm font-black uppercase text-black mb-1">
                  Balanced Keycard Pickup Queue Lines
                </h3>
                <p className="font-mono text-xs text-zinc-600 mb-4">
                  To eliminate check-in bottlenecks, the platform pre-calculates an equal load across 4 lines. Pre-sorted physical lanyards can be prepared beforehand.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-2 border-black bg-white p-3 text-center">
                      <div className="font-mono text-xs font-black text-accent-purple">LINE {i}</div>
                      <div className="font-mono text-[10px] text-zinc-500 mt-0.5">25% Capacity</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-2 border-black bg-purple-50 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-black text-accent-blue uppercase">VIP Fast-Track Lane</div>
                    <div className="font-mono text-[10px] text-zinc-600">Dedicated lane for VIPs, speakers &amp; sponsors</div>
                  </div>
                  <span className="border border-black bg-accent-blue text-white px-2 py-0.5 font-mono text-[10px] font-black">
                    ENABLED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: SPONSORS ── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-zinc-50 p-4 space-y-3">
                <span className="font-mono text-xs font-black uppercase text-black block">
                  Add Event Sponsors:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Sponsor Company Name (e.g. Intel)..."
                    value={sponsorNameInput}
                    onChange={(e) => setSponsorNameInput(e.target.value)}
                    className="flex-1 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs text-black"
                  />
                  <select
                    value={sponsorTierInput}
                    onChange={(e) => setSponsorTierInput(e.target.value)}
                    className="border-2 border-black bg-white px-2 py-1.5 font-mono text-xs font-bold"
                  >
                    <option value="title">Title Sponsor</option>
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="community">Community</option>
                  </select>
                  <button
                    type="button"
                    onClick={addSponsor}
                    className="border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Sponsor Cards List */}
              <div className="space-y-2">
                {sponsorsList.map((s, idx) => (
                  <div key={idx} className="border border-black bg-white p-3 flex items-center justify-between">
                    <div>
                      <strong className="font-mono text-sm font-black uppercase text-black">{s.name}</strong>
                      <span className="ml-2 border border-black bg-zinc-100 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase">
                        {s.tier}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSponsor(idx)}
                      className="border border-black text-red-600 p-1 hover:bg-red-50"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 5: STAFF VOLUNTEERS ── */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-2 border-black bg-zinc-50 p-4 space-y-3">
                <span className="font-mono text-xs font-black uppercase text-black block">
                  Invite Check-In Staff Volunteers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Staff Member Name..."
                    value={staffNameInput}
                    onChange={(e) => setStaffNameInput(e.target.value)}
                    className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs text-black"
                  />
                  <input
                    type="email"
                    placeholder="Staff Email Address..."
                    value={staffEmailInput}
                    onChange={(e) => setStaffEmailInput(e.target.value)}
                    className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs text-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={addStaff}
                  className="border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
                >
                  Add Staff Member
                </button>
              </div>

              {/* Staff List */}
              <div className="space-y-2">
                {staffList.map((st, idx) => (
                  <div key={idx} className="border border-black bg-white p-3 flex items-center justify-between">
                    <div>
                      <strong className="font-mono text-sm font-black uppercase text-black">{st.name}</strong>
                      <span className="ml-2 font-mono text-xs text-zinc-500">&lt;{st.email}&gt;</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStaff(idx)}
                      className="border border-black text-red-600 p-1 hover:bg-red-50"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t-[3px] border-black bg-zinc-100 p-4 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex items-center gap-1 border-2 border-black bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-200 cursor-pointer"
            >
              <HiOutlineArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && (!title.trim() || !slug.trim() || !venueName.trim() || !startTime || !endTime)) {
                  toast.error("Please fill in all required fields.");
                  return;
                }
                setCurrentStep((prev) => prev + 1);
              }}
              className="flex items-center gap-1 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
            >
              <span>Next Step</span>
              <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 border-2 border-black bg-black px-5 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple disabled:opacity-50 cursor-pointer"
            >
              <HiOutlineCheck className="h-4 w-4" />
              <span>{loading ? "Publishing Event..." : "Publish Event & Form →"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
