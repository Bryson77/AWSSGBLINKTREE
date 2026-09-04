"use client";

/**
 * awssbg Admin — Dedicated Cloud Management Console (Standalone App).
 * Geometry: 0px sharp corners, 3px solid black borders, hard drop shadows.
 * Navigation: Collapsible Neo-Brutalist Left Sidebar (Dashboard, Analytics, Links, Inquiries, Settings/Team).
 * Authentication: Supabase email/password, magic link, password recovery.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase, LinkItem, InquiryItem, Organization, getIconForPlatform, logActivity } from "@awssbg/shared";
import { BlogManager } from "../components/BlogManager";
import { TeamPageManager } from "../components/TeamPageManager";
import { OrgSettingsView } from "../components/OrgSettingsView";
import { ActivityLogView } from "../components/ActivityLogView";
import { AnnouncementManager } from "../components/AnnouncementManager";
import { EventsManager } from "../components/EventsManager";
import {
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiPlus,
  HiOutlineTicket,
  HiOutlineUserGroup,
  HiOutlineKey,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineUserPlus,
  HiOutlineSquares2X2,
  HiOutlineChartBar,
  HiOutlineLink,
  HiOutlineEnvelope,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineBars3,
  HiOutlineEye,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineBuildingOffice2,
  HiOutlineMegaphone,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";

const PLATFORMS = [
  "aws",
  "aws-skill-builder",
  "meetup",
  "whatsapp",
  "discord",
  "linkedin",
  "github",
  "youtube",
  "instagram",
  "x",
  "tiktok",
  "facebook",
  "telegram",
  "medium",
  "devto",
  "hashnode",
  "website",
] as const;

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_super_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

// ── User-Friendly Error Sanitizer ──
function formatUserError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  const msg = typeof err === "string" ? err : (err as Error).message || fallback;
  const lower = msg.toLowerCase();

  if (lower.includes("service_role") || lower.includes("service role") || lower.includes("supabase_service")) {
    return "Server configuration is finalizing. Please try again in a moment.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
    return "Incorrect email or password. Please verify your credentials.";
  }
  if (lower.includes("email not confirmed")) {
    return "Your email has not been confirmed yet. Please check your inbox.";
  }
  if (lower.includes("already been registered") || lower.includes("already exists")) {
    return "This user is already part of the team. You can send them a password reset link instead.";
  }
  if (lower.includes("rate limit") || lower.includes("over_email_send_rate_limit") || lower.includes("too many requests")) {
    return "Request limit reached. Please wait a few minutes before trying again.";
  }
  if (lower.includes("jwt") || lower.includes("unauthorized") || lower.includes("session")) {
    return "Your session has expired. Please sign out and sign back in.";
  }
  if (lower.includes("forbidden") || lower.includes("superadmin")) {
    return "Access restricted: Superadmin builder privileges required.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network error")) {
    return "Network connection issue. Please check your connection.";
  }
  if (lower.includes("password should be at least")) {
    return "Password is too short. It must contain at least 8 characters.";
  }

  return msg;
}

// ── Live Password Strength Meter ──
function PasswordStrengthMeter({ password }: { password: string }) {
  const analysis = useMemo(() => {
    let score = 0;
    const checks = {
      length8: password.length >= 8,
      length12: password.length >= 12,
      mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^a-zA-Z0-9]/.test(password),
    };

    if (checks.length8) score += 1;
    if (checks.mixedCase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.symbols) score += 1;
    if (checks.length12 && score >= 3) score = 4;

    let label = "VERY WEAK";
    let color = "bg-red-500 text-white";
    let activeBars = 1;

    if (password.length === 0) {
      return { score: 0, label: "ENTER PASSWORD", color: "bg-zinc-200 text-zinc-600", activeBars: 0, checks };
    }

    if (score <= 1) {
      label = "WEAK";
      color = "bg-red-500 text-white";
      activeBars = 1;
    } else if (score === 2) {
      label = "FAIR";
      color = "bg-amber-500 text-black";
      activeBars = 2;
    } else if (score === 3) {
      label = "STRONG";
      color = "bg-[#7C3AED] text-white";
      activeBars = 3;
    } else if (score >= 4) {
      label = "INVINCIBLE";
      color = "bg-[#2563EB] text-white";
      activeBars = 4;
    }

    return { score, label, color, activeBars, checks };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 border-2 border-black bg-zinc-50 p-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
          Entropy Rank:
        </span>
        <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase ${analysis.color} shadow-[1px_1px_0px_#000000]`}>
          [ {analysis.label} ]
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-2 border border-black transition-colors ${
              bar <= analysis.activeBars ? analysis.color.split(" ")[0] : "bg-zinc-200"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-zinc-700 pt-1">
        <div className={`flex items-center gap-1 ${analysis.checks.length8 ? "text-emerald-700 font-bold" : ""}`}>
          {analysis.checks.length8 ? <HiOutlineCheck className="h-3 w-3" /> : <HiOutlineXMark className="h-3 w-3" />}
          <span>Min 8 chars</span>
        </div>
        <div className={`flex items-center gap-1 ${analysis.checks.mixedCase ? "text-emerald-700 font-bold" : ""}`}>
          {analysis.checks.mixedCase ? <HiOutlineCheck className="h-3 w-3" /> : <HiOutlineXMark className="h-3 w-3" />}
          <span>A-Z and a-z</span>
        </div>
        <div className={`flex items-center gap-1 ${analysis.checks.numbers ? "text-emerald-700 font-bold" : ""}`}>
          {analysis.checks.numbers ? <HiOutlineCheck className="h-3 w-3" /> : <HiOutlineXMark className="h-3 w-3" />}
          <span>0-9 numbers</span>
        </div>
        <div className={`flex items-center gap-1 ${analysis.checks.symbols ? "text-emerald-700 font-bold" : ""}`}>
          {analysis.checks.symbols ? <HiOutlineCheck className="h-3 w-3" /> : <HiOutlineXMark className="h-3 w-3" />}
          <span>Symbols (!@#$)</span>
        </div>
      </div>
    </div>
  );
}

// ── Login Form ──
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic" | "recovery">("password");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Authenticated as Admin");
        // Dispatch security notification
        fetch("/api/notify-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "login", email }),
        }).catch(() => {});
        onLogin();
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Magic link dispatched", {
          description: `Check ${email} for your passwordless sign-in token.`,
        });
      } else if (mode === "recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        toast.success("Recovery email sent", {
          description: `Check ${email} for password reset instructions.`,
        });
      }
    } catch (err) {
      toast.error("Authentication failed", { description: formatUserError(err, "Please check your login details and try again.") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] p-5">
      <div className="w-full max-w-sm border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-2 border-black bg-white p-2 shadow-[3px_3px_0px_#000000]">
            <Image
              src="/logo.png"
              alt="AWS SBG Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="mb-1 inline-block border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_#7C3AED]">
            // AWS_SBG_MGMT
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            Admin Portal
          </h1>
          <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
            Dedicated Cloud Management Console
          </p>
        </div>

        <div className="mb-5 flex border-2 border-black bg-zinc-100 p-0.5">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 py-1 font-mono text-[10px] font-black uppercase transition-all ${
              mode === "password"
                ? "bg-black text-white shadow-[1px_1px_0px_#000000]"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`flex-1 py-1 font-mono text-[10px] font-black uppercase transition-all ${
              mode === "magic"
                ? "bg-black text-white shadow-[1px_1px_0px_#000000]"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => setMode("recovery")}
            className={`flex-1 py-1 font-mono text-[10px] font-black uppercase transition-all ${
              mode === "recovery"
                ? "bg-black text-white shadow-[1px_1px_0px_#000000]"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block font-mono text-[11px] font-black uppercase tracking-wider text-black"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="admin@awssbg.online"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black outline-none transition-shadow focus:shadow-[3px_3px_0px_#7C3AED]"
            />
          </div>

          {mode === "password" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block font-mono text-[11px] font-black uppercase tracking-wider text-black"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode("recovery")}
                  className="font-mono text-[10px] font-bold text-zinc-500 underline hover:text-accent-purple cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-black bg-white px-3.5 py-2.5 font-mono text-sm text-black outline-none transition-shadow focus:shadow-[3px_3px_0px_#7C3AED]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-black bg-black py-3 font-mono text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0px_#7C3AED] transition-all hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating…" : mode === "password" ? "Sign In →" : mode === "magic" ? "Send Magic Link →" : "Send Reset Email →"}
          </button>
        </form>

        <div className="mt-6 border-t-2 border-black/10 pt-4 text-center">
          <a
            href="https://awssbg.online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-black underline underline-offset-4 hover:text-accent-purple"
          >
            <span>Visit Public Site ↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Link Editor Modal ──
function LinkEditor({
  link,
  onSave,
  onCancel,
}: {
  link: Partial<LinkItem> | null;
  onSave: (data: Partial<LinkItem>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(link?.title ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [platform, setPlatform] = useState(link?.platform ?? "website");
  const [description, setDescription] = useState(link?.description ?? "");
  const [isActive, setIsActive] = useState(link?.is_active ?? true);
  const isEditing = !!link?.id;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...(link?.id ? { id: link.id } : {}),
      title,
      url,
      platform,
      description: description || null,
      is_active: isActive,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border-[3px] border-black bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#000000]"
      >
        <div className="border-b-2 border-black pb-3">
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            {isEditing ? "Edit Link Card" : "Create New Link"}
          </h2>
          <p className="font-mono text-xs font-medium text-zinc-600">
            Publish or update a live destination card.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Title / Display Label
          </label>
          <input
            type="text"
            required
            placeholder="e.g. AWS Certification Study Jam"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Destination URL
          </label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Platform / Brand Icon
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 text-sm font-semibold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED] cursor-pointer"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Description Subtext (Optional)
          </label>
          <input
            type="text"
            placeholder="Short 1-line note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        <label className="flex items-center gap-3 border-2 border-black bg-zinc-100 p-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded-none accent-black"
          />
          <span className="font-mono text-xs font-bold uppercase text-black">
            Publish on live site [ACTIVE]
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
          >
            {isEditing ? "Save Changes" : "Create Link"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Superadmin User Invite Modal ──
function InviteUserModal({
  token,
  orgs = [],
  defaultOrgId,
  onClose,
  onUserInvited,
}: {
  token: string;
  orgs?: Organization[];
  defaultOrgId?: string;
  onClose: () => void;
  onUserInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [orgId, setOrgId] = useState(defaultOrgId || orgs[0]?.id || "");
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.split("@")[0],
          role,
          org_id: orgId || undefined,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      toast.success("User invited successfully!", {
        description: `Invitation email sent to ${email}.`,
        action: data.inviteLink ? {
          label: "Copy Link",
          onClick: () => {
            navigator.clipboard.writeText(data.inviteLink);
            toast.success("Invite link copied to clipboard!");
          }
        } : undefined,
      });
      onUserInvited();
      onClose();
    } catch (err) {
      toast.error("Invitation failed", { description: formatUserError(err, "Unable to dispatch invitation at this time.") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs">
      <form
        onSubmit={handleInvite}
        className="w-full max-w-md space-y-4 border-[3px] border-black bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#000000]"
      >
        <div className="border-b-2 border-black pb-3">
          <div className="mb-1 inline-block border border-black bg-accent-purple px-2 py-0.2 font-mono text-[9px] font-black text-white">
            // ACCESS_AUTHORIZATION
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Invite Team Member
          </h2>
          <p className="font-mono text-xs font-medium text-zinc-600">
            Send an official onboarding invitation to grant dashboard access.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Full Name / Display Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sarah Cloud"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="builder@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        {orgs.length > 0 && (
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
              Assigned Group
            </label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED] cursor-pointer"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Access Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED] cursor-pointer"
          >
            <option value="member">MEMBER (Manage Links, Posts, Team Bios)</option>
            <option value="leader">GROUP LEADER (Manage Group Settings &amp; Members)</option>
            <option value="superadmin">SUPERADMIN (Global Management)</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Sending Invite…" : "Send Invite Email →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Superadmin Add New SBG Onboarding Modal (§8.2) ──
function AddNewSbgModal({
  token,
  onClose,
  onOrgCreated,
}: {
  token: string;
  onClose: () => void;
  onOrgCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug || slug === autoSlug.slice(0, slug.length)) {
      setSlug(autoSlug);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !leaderEmail.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          leader_name: leaderName.trim() || leaderEmail.split("@")[0],
          leader_email: leaderEmail.trim().toLowerCase(),
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard new SBG.");
      }

      toast.success(`AWS SBG @${slug.toUpperCase()} onboarded!`, {
        description: `Leader invite sent to ${leaderEmail}.`,
        action: data.inviteLink
          ? {
              label: "Copy Invite",
              onClick: () => {
                navigator.clipboard.writeText(data.inviteLink);
                toast.success("Leader invite link copied!");
              },
            }
          : undefined,
      });

      onOrgCreated();
      onClose();
    } catch (err) {
      toast.error("SBG Onboarding Failed", {
        description: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 border-[3px] border-black bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#000000]"
      >
        <div className="border-b-2 border-black pb-3">
          <div className="mb-1 inline-block border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
            // SBG_EXPANSION (§8.2)
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Onboard New University SBG
          </h2>
          <p className="font-mono text-xs font-medium text-zinc-600">
            Establish a new student SBG with its own links, blog, team page, and designated Leader.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            University / Institution Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. University of Pretoria"
            value={name}
            onChange={handleNameChange}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            SBG URL Identifier (Slug) *
          </label>
          <div className="flex items-center">
            <span className="border-2 border-r-0 border-black bg-zinc-100 px-2.5 py-2 font-mono text-xs font-bold text-zinc-600">
              awssbg.online/
            </span>
            <input
              type="text"
              required
              placeholder="up"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-500 mt-1 block">
            Only lowercase letters, numbers, and hyphens.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
              Appointed Leader Name
            </label>
            <input
              type="text"
              placeholder="e.g. Kamohelo Molefe"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
              Leader Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="leader@university.edu"
              value={leaderEmail}
              onChange={(e) => setLeaderEmail(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Onboarding SBG…" : "Launch SBG & Invite Leader →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Password Reset / Update Modal ──
function PasswordUpdateModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Password update failed", { description: formatUserError(error, "Unable to update password. Please try again.") });
      setLoading(false);
    } else {
      toast.success("Password updated successfully!", {
        description: "Your new password is now active.",
      });
      // Dispatch password changed notification
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          fetch("/api/notify-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "password_changed", email: user.email }),
          }).catch(() => {});
        }
      });
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs">
      <form
        onSubmit={handleUpdatePassword}
        className="w-full max-w-sm space-y-4 border-[3px] border-black bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#000000]"
      >
        <div className="border-b-2 border-black pb-3">
          <div className="mb-1 inline-block border border-black bg-accent-purple px-2 py-0.2 font-mono text-[9px] font-black text-white">
            // AUTH_SETTINGS
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Update Password
          </h2>
          <p className="font-mono text-xs font-medium text-zinc-600">
            Set a hardened password for your admin account.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            New Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
          <PasswordStrengthMeter password={newPassword} />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Confirm Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200 cursor-pointer"
          >
            Later
          </button>
          <button
            type="submit"
            disabled={loading || newPassword.length < 8}
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Updating…" : "Update Password →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Dedicated Unskippable Setup Password Screen for Invites & Password Resets ──
function ForceSetPasswordScreen({
  email,
  onComplete,
}: {
  email: string;
  onComplete: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_set: true },
    });

    if (error) {
      toast.error("Password setup failed", {
        description: formatUserError(error, "Unable to establish password. Please try again."),
      });
      setLoading(false);
    } else {
      toast.success("Master password configured!", {
        description: "Your credentials are now active. Welcome to AWS SBG Admin.",
      });

      // Clear the invite/recovery hash tokens from the browser URL bar
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Notify security webhook
      fetch("/api/notify-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password_changed", email }),
      }).catch(() => {});

      setLoading(false);
      onComplete();
    }
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] p-4 sm:p-6">
      <div className="w-full max-w-md border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-2 border-black bg-white p-2 shadow-[3px_3px_0px_#000000]">
            <Image
              src="/logo.png"
              alt="AWS SBG Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="mb-1 inline-block border border-black bg-accent-purple px-2 py-0.5 font-mono text-[9px] font-black text-white">
            // MANDATORY_SECURITY_GATEWAY
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            Configure Password
          </h1>
          <p className="mt-1 font-mono text-xs font-medium text-zinc-600">
            Welcome to the AWS SBG Admin Console. Set a master password to activate your account.
          </p>
          {email && (
            <div className="mt-3 border border-black bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-bold text-black">
              Account: {email}
            </div>
          )}
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
              Master Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || newPassword.length < 8}
            className="w-full border-2 border-black bg-black py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Activating Credentials…" : "Set Password & Enter Console →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Inquiry Detail Modal ──
function InquiryModal({
  inquiry,
  onClose,
  onStatusChange,
  onDelete,
}: {
  inquiry: InquiryItem;
  onClose: () => void;
  onStatusChange: (id: string, status: InquiryItem["status"]) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs">
      <div className="w-full max-w-lg space-y-4 border-[3px] border-black bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#000000]">
        <div className="border-b-2 border-black pb-3 flex items-center justify-between">
          <div>
            <div className="mb-1 inline-block border border-black bg-accent-purple px-2 py-0.2 font-mono text-[9px] font-black text-white">
              // INQUIRY_DETAIL
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              {inquiry.category}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between border-b border-black/10 pb-1.5">
            <span className="font-bold text-zinc-500">From:</span>
            <span className="font-black text-black">{inquiry.name}</span>
          </div>
          <div className="flex justify-between border-b border-black/10 pb-1.5">
            <span className="font-bold text-zinc-500">Email:</span>
            <a href={`mailto:${inquiry.email}`} className="font-black text-accent-purple underline">
              {inquiry.email}
            </a>
          </div>
          <div className="flex justify-between border-b border-black/10 pb-1.5">
            <span className="font-bold text-zinc-500">Received:</span>
            <span className="text-zinc-700">{new Date(inquiry.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-zinc-500">Status:</span>
            <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase ${
              inquiry.status === "unread" ? "bg-amber-300 text-black" : inquiry.status === "replied" ? "bg-emerald-300 text-black" : "bg-zinc-200 text-zinc-800"
            }`}>
              {inquiry.status}
            </span>
          </div>
        </div>

        <div className="border-2 border-black bg-zinc-50 p-3.5">
          <span className="block font-mono text-[10px] font-bold text-zinc-500 mb-1">// MESSAGE_BODY</span>
          <p className="font-sans text-sm text-black leading-relaxed whitespace-pre-wrap">
            {inquiry.message}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-black">
          <a
            href={`mailto:${inquiry.email}?subject=Re:%20AWS%20SBG%20Inquiry%20-%20${encodeURIComponent(inquiry.category)}`}
            onClick={() => onStatusChange(inquiry.id, "replied")}
            className="flex-1 flex items-center justify-center gap-1.5 border-2 border-black bg-accent-purple px-3 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-black text-center no-underline"
          >
            <span>Reply via Email</span>
            <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
          </a>

          {inquiry.status === "unread" ? (
            <button
              onClick={() => onStatusChange(inquiry.id, "read")}
              className="border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
            >
              Mark Read
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(inquiry.id, "unread")}
              className="border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
            >
              Mark Unread
            </button>
          )}

          <button
            onClick={() => onDelete(inquiry.id)}
            className="border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-red-600 shadow-[2px_2px_0px_#000000] hover:bg-red-50 cursor-pointer"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Preview Modal ──
function LivePreviewModal({ links, onClose }: { links: LinkItem[]; onClose: () => void }) {
  const activeLinks = links.filter((l) => l.is_active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto border-[3px] border-black bg-[#F4F4F5] p-4 shadow-[8px_8px_0px_#000000]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black text-white">
              MOBILE_SIMULATOR
            </span>
            <span className="font-mono text-xs font-bold text-black">awssbg.online</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        </div>

        {/* Mock Public View */}
        <div className="text-center py-3">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center border-2 border-black bg-white p-1 shadow-[2px_2px_0px_#000000]">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          </div>
          <h2 className="text-sm font-black uppercase text-black">Build, Certify &amp; Connect</h2>
          <p className="text-[11px] text-zinc-600 font-medium mt-0.5">AWS Student Builder Group</p>
        </div>

        <div className="flex flex-col gap-2.5 my-3">
          {activeLinks.map((link) => {
            const Icon = getIconForPlatform(link.platform);
            return (
              <div
                key={link.id}
                className="flex items-center justify-between border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_#000000]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center border border-black bg-zinc-100">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="block font-black text-xs uppercase text-black">{link.title}</span>
                    {link.description && (
                      <span className="block font-mono text-[9px] text-zinc-500">{link.description}</span>
                    )}
                  </div>
                </div>
                <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 text-zinc-400" />
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center border-t border-black/10 font-mono text-[9px] text-zinc-400">
          &copy; AWS Student Builder Group
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard Console ──
function Dashboard() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-tenant Groups & Role State
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Sidebar & View state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    "dashboard" | "analytics" | "links" | "posts" | "team_page" | "announcements" | "events" | "activity" | "inquiries" | "team"
  >("dashboard");

  // Modals state
  const [editing, setEditing] = useState<Partial<LinkItem> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);

  // Inquiries filter
  const [inquiryCategoryFilter, setInquiryCategoryFilter] = useState("all");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");

  // User auth state
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");

  const fetchLinks = useCallback(async (orgId?: string) => {
    let query = supabase.from("links").select("*");
    if (orgId && orgId !== "all") {
      query = query.eq("org_id", orgId);
    }
    const { data, error } = await query.order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load links", { description: formatUserError(error, "Please refresh the page to try again.") });
    } else if (data) {
      setLinks(data as LinkItem[]);
    }
  }, []);

  const fetchInquiries = useCallback(async (orgId?: string) => {
    let query = supabase.from("inquiries").select("*");
    if (orgId && orgId !== "all") {
      query = query.eq("org_id", orgId);
    }
    const { data } = await query.order("created_at", { ascending: false });

    if (data) {
      setInquiries(data as InquiryItem[]);
    }
  }, []);

  const fetchUsers = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Ignore in offline development
    }
  }, []);

  // Fetch Orgs & User Profile
  const loadUserAndOrgs = useCallback(
    async (session: any) => {
      const email = session.user.email || "";
      setCurrentUserEmail(email);
      setCurrentUserId(session.user.id);
      setSessionToken(session.access_token);

      // Fetch orgs
      const { data: orgsData } = await supabase.from("orgs").select("*").order("name", { ascending: true });
      const loadedOrgs = (orgsData as Organization[]) || [];
      setOrgs(loadedOrgs);

      // Fetch admin user record
      const { data: profile } = await supabase.from("admin_users").select("*").eq("id", session.user.id).single();

      const isSuper =
        profile?.is_super_admin === true ||
        profile?.role === "superadmin" ||
        email === "lethabomabilo33@gmail.com";

      setIsSuperAdmin(isSuper);
      setCurrentUserRole(profile?.role || (isSuper ? "superadmin" : "member"));
      setCurrentUserName(profile?.name || email.split("@")[0] || "Admin");

      // Initial active group: user's assigned org or first loaded org from database
      let initialOrg = profile?.org_id;
      if (!initialOrg || isSuper) {
        initialOrg = loadedOrgs[0]?.id || "";
      }

      setSelectedOrgId(initialOrg);
      fetchLinks(initialOrg);
      fetchInquiries(initialOrg);

      if (isSuper || profile?.role === "leader") {
        fetchUsers(session.access_token);
      }
    },
    [fetchLinks, fetchInquiries, fetchUsers]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserAndOrgs(session);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserAndOrgs(session);
      } else {
        setCurrentUserEmail("");
        setSessionToken("");
        setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserAndOrgs]);

  // Re-fetch links and inquiries when group selection switches
  useEffect(() => {
    if (selectedOrgId) {
      fetchLinks(selectedOrgId);
      fetchInquiries(selectedOrgId);
    }
  }, [selectedOrgId, fetchLinks, fetchInquiries]);

  // Total link click traffic
  const totalClicks = useMemo(() => {
    return links.reduce((sum, link) => sum + (link.click_count || 0), 0);
  }, [links]);

  // Unread count
  const unreadInquiriesCount = useMemo(() => {
    return inquiries.filter((i) => i.status === "unread").length;
  }, [inquiries]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesCategory =
        inquiryCategoryFilter === "ALL" || inq.category === inquiryCategoryFilter;
      const matchesStatus =
        inquiryStatusFilter === "ALL" || inq.status === inquiryStatusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [inquiries, inquiryCategoryFilter, inquiryStatusFilter]);

  const handleExportInquiriesCSV = async () => {
    if (inquiries.length === 0) {
      toast.error("No inquiries available to export.");
      return;
    }
    const dataToExport = filteredInquiries.length > 0 ? filteredInquiries : inquiries;
    const headers = ["ID", "Name", "Email", "Category", "Status", "Date Received", "Message"];
    const escapeCell = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = dataToExport.map((item) => [
      escapeCell(item.id),
      escapeCell(item.name),
      escapeCell(item.email),
      escapeCell(item.category),
      escapeCell(item.status),
      escapeCell(new Date(item.created_at).toISOString()),
      escapeCell(item.message),
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inquiries_${selectedOrgId || "all"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Inquiries exported as CSV");

    await logActivity(supabase, {
      org_id: selectedOrgId || null,
      actor_id: currentUserId,
      actor_name: currentUserName || currentUserEmail,
      action: "inquiries.exported",
      entity_type: "inquiry",
      summary: `Exported ${dataToExport.length} inquiries to CSV`,
    });
  };

  async function handleSaveLink(data: Partial<LinkItem>) {
    const targetOrgId = selectedOrgId || undefined;
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabase.from("links").update(rest).eq("id", id);
      if (error) {
        toast.error("Failed to update link", { description: formatUserError(error, "Please check your inputs and try again.") });
      } else {
        toast.success("Link updated successfully!");
        await logActivity(supabase, {
          org_id: targetOrgId || null,
          actor_id: currentUserId,
          actor_name: currentUserName || currentUserEmail,
          action: "link.updated",
          entity_type: "link",
          entity_id: id,
          summary: `Updated link card "${data.title}"`,
        });
        fetchLinks(selectedOrgId);
      }
    } else {
      const maxOrder = links.length > 0 ? Math.max(...links.map((l) => l.sort_order)) : 0;
      const { data: newLink, error } = await supabase
        .from("links")
        .insert({ ...data, org_id: targetOrgId, sort_order: maxOrder + 1, click_count: 0 })
        .select("id")
        .single();

      if (error) {
        toast.error("Failed to create link", { description: formatUserError(error, "Please check your inputs and try again.") });
      } else {
        toast.success("Link created successfully!");
        await logActivity(supabase, {
          org_id: targetOrgId || null,
          actor_id: currentUserId,
          actor_name: currentUserName || currentUserEmail,
          action: "link.created",
          entity_type: "link",
          entity_id: newLink?.id,
          summary: `Created link card "${data.title}"`,
        });
        fetchLinks(selectedOrgId);
      }
    }
    setEditing(null);
    setShowEditor(false);
  }

  async function handleDeleteLink(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete link", { description: formatUserError(error, "Unable to delete link at this time.") });
    } else {
      toast.success("Link deleted");
      await logActivity(supabase, {
        org_id: selectedOrgId || null,
        actor_id: currentUserId,
        actor_name: currentUserName || currentUserEmail,
        action: "link.deleted",
        entity_type: "link",
        entity_id: id,
        summary: `Deleted link card "${title}"`,
      });
      fetchLinks(selectedOrgId);
    }
  }

  async function handleToggleActive(link: LinkItem) {
    const nextState = !link.is_active;
    const { error } = await supabase
      .from("links")
      .update({ is_active: nextState })
      .eq("id", link.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast(nextState ? "Link activated" : "Link hidden", {
        description: `"${link.title}" is now ${nextState ? "visible" : "hidden"} on the public page.`,
      });
      fetchLinks();
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const current = links[index];
    const above = links[index - 1];
    await supabase.from("links").update({ sort_order: above.sort_order }).eq("id", current.id);
    await supabase.from("links").update({ sort_order: current.sort_order }).eq("id", above.id);
    toast.success("Order updated");
    fetchLinks();
  }

  async function handleMoveDown(index: number) {
    if (index === links.length - 1) return;
    const current = links[index];
    const below = links[index + 1];
    await supabase.from("links").update({ sort_order: below.sort_order }).eq("id", current.id);
    await supabase.from("links").update({ sort_order: current.sort_order }).eq("id", below.id);
    toast.success("Order updated");
    fetchLinks();
  }

  async function handleInquiryStatusChange(id: string, status: InquiryItem["status"]) {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update inquiry status");
    } else {
      toast.success(`Inquiry marked as ${status}`);
      fetchInquiries();
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status });
      }
    }
  }

  async function handleDeleteInquiry(id: string) {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete inquiry");
    } else {
      toast.success("Inquiry deleted");
      setSelectedInquiry(null);
      fetchInquiries();
    }
  }

  async function handleDeleteUser(userId: string, userEmail: string) {
    if (!confirm(`Are you sure you want to remove ${userEmail} from admin access?`)) return;

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove user");

      toast.success("Admin user removed");
      fetchUsers(sessionToken);
    } catch (err) {
      toast.error("Delete failed", { description: formatUserError(err, "Unable to remove user.") });
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast("Logged out");
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F5]">
        <div className="flex flex-col items-center gap-2 border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_#000000]">
          <div className="h-6 w-6 animate-spin border-2 border-black border-t-accent-purple" />
          <p className="font-mono text-xs font-bold uppercase text-black">Loading AWS SBG Admin Console…</p>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: HiOutlineSquares2X2 },
    { id: "analytics", label: "Analytics", icon: HiOutlineChartBar },
    { id: "links", label: `Links (${links.length})`, icon: HiOutlineLink },
    { id: "posts", label: "Blog", icon: HiOutlineDocumentText },
    { id: "team_page", label: "Team Page", icon: HiOutlineUsers },
    { id: "announcements", label: "Announcements", icon: HiOutlineMegaphone },
    { id: "events", label: "Events & Passes", icon: HiOutlineTicket },
    { id: "inquiries", label: "Inquiries", badge: unreadInquiriesCount, icon: HiOutlineEnvelope },
    { id: "activity", label: "Activity Log", icon: HiOutlineClock },
    { id: "team", label: "Users & Roles", icon: HiOutlineUserGroup },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#F4F4F5]">
      {/* ── Desktop Collapsible Left Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col justify-between border-r-[3px] border-black bg-white transition-all duration-200 sticky top-0 h-screen z-30 ${
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {/* Top Header Stamp */}
        <div>
          <div className="flex items-center justify-between border-b-[3px] border-black p-3.5">
            <div className={`flex items-center gap-2.5 overflow-hidden ${sidebarCollapsed ? "justify-center w-full" : ""}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-white p-1 shadow-[2px_2px_0px_#000000]">
                <Image src="/logo.png" alt="Logo" width={24} height={24} className="h-full w-full object-contain" />
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <span className="block font-mono text-[12px] font-black uppercase text-black">
                    AWS SBG <span className="text-accent-purple">//</span> MGMT
                  </span>
                  <span className="block font-mono text-[9px] font-bold text-zinc-500 truncate">
                    Console v2.0
                  </span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="flex h-7 w-7 items-center justify-center border-2 border-black bg-white hover:bg-zinc-100 shadow-[1px_1px_0px_#000000] cursor-pointer"
                title="Collapse sidebar"
              >
                <HiOutlineChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Collapsed expansion button */}
          {sidebarCollapsed && (
            <div className="p-2 text-center border-b border-black/10">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-full flex items-center justify-center py-1 border border-black bg-zinc-50 hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <HiOutlineChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Neo-Brutalist Group Switcher */}
          {!sidebarCollapsed && orgs.length > 0 && (
            <div className="border-b-[3px] border-black bg-zinc-50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] font-black uppercase text-zinc-500">
                  Active SBG:
                </span>
                {isSuperAdmin ? (
                  <button
                    onClick={() => setShowAddOrgModal(true)}
                    className="font-mono text-[9px] font-black uppercase text-accent-purple hover:underline cursor-pointer"
                    title="Onboard new university SBG"
                  >
                    + Add SBG
                  </button>
                ) : (
                  <span className="flex items-center gap-0.5 font-mono text-[8px] font-bold text-zinc-500 uppercase">
                    Locked
                  </span>
                )}
              </div>
              {isSuperAdmin ? (
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full border-2 border-black bg-white px-2 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000]">
                  <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">
                    {orgs.find((o) => o.id === selectedOrgId)?.name || "Assigned Group"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 border-2 font-mono text-xs font-black uppercase transition-all cursor-pointer ${
                    isActive
                      ? "border-black bg-black text-white shadow-[3px_3px_0px_#7C3AED]"
                      : "border-transparent text-zinc-700 hover:border-black hover:bg-zinc-100"
                  } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <div className="flex-1 flex items-center justify-between text-left">
                      <span>{item.label}</span>
                      {"badge" in item && item.badge > 0 && (
                        <span className="border border-black bg-amber-300 text-black px-1.5 py-0.2 font-mono text-[9px] font-black shadow-[1px_1px_0px_#000000]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Account Section */}
        <div className="border-t-[3px] border-black p-3 space-y-2">
          {!sidebarCollapsed ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-black uppercase text-black truncate max-w-[120px]">
                  {currentUserEmail.split("@")[0]}
                </span>
                <span className="border border-black bg-accent-purple px-1.5 py-0.2 font-mono text-[8px] font-black text-white">
                  {isSuperAdmin ? "SUPERADMIN" : "ADMIN"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-white py-1 font-mono text-[10px] font-bold text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                  title="Update Password"
                >
                  <HiOutlineKey className="h-3 w-3" />
                  <span>Key</span>
                </button>
                <a
                  href="https://awssbg.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center border-2 border-black bg-white p-1 shadow-[1px_1px_0px_#000000] hover:bg-zinc-100"
                  title="Open Public Site"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 text-black" />
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center border-2 border-black bg-white p-1 text-red-600 shadow-[1px_1px_0px_#000000] hover:bg-red-50 cursor-pointer"
                  title="Sign Out"
                >
                  <HiOutlineArrowRightOnRectangle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex h-8 w-8 items-center justify-center border border-black bg-white hover:bg-zinc-100 cursor-pointer"
                title="Update Password"
              >
                <HiOutlineKey className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center border border-black bg-white text-red-600 hover:bg-red-50 cursor-pointer"
                title="Sign Out"
              >
                <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between border-b-[3px] border-black bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="font-mono text-xs font-black uppercase text-black">
              AWS SBG MGMT
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_#000000] cursor-pointer"
          >
            <HiOutlineBars3 className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b-[3px] border-black bg-white p-4 space-y-2 shadow-[0px_6px_0px_#000000]">
            {orgs.length > 0 && (
              <div className="mb-2 border-2 border-black bg-zinc-50 p-2">
                <span className="block font-mono text-[9px] font-black uppercase text-zinc-500 mb-1">
                  Active SBG:
                </span>
                {isSuperAdmin ? (
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full border-2 border-black bg-white px-2 py-1 font-mono text-xs font-bold text-black"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono text-xs font-bold text-black">
                    {orgs.find((o) => o.id === selectedOrgId)?.name || "Assigned Group"}
                  </span>
                )}
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 border-2 font-mono text-xs font-black uppercase ${
                    isActive ? "border-black bg-black text-white" : "border-black bg-white text-black"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {"badge" in item && item.badge > 0 && (
                    <span className="bg-amber-300 text-black px-1.5 py-0.2 text-[9px] font-black">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="pt-2 border-t border-black/10 flex gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 border-2 border-black bg-white py-1.5 font-mono text-xs font-bold text-black"
              >
                Password
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 border-2 border-black bg-red-50 py-1.5 font-mono text-xs font-bold text-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto">
          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW 1: DASHBOARD */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              {/* Header Stamp */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
                <div>
                  <div className="mb-1 inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black text-white">
                    // SYSTEM_OVERVIEW
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                    AWS SBG Dashboard
                  </h1>
                  <p className="font-mono text-xs text-zinc-600 mt-0.5">
                    Live operational metrics for the student community hub.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(null);
                      setShowEditor(true);
                    }}
                    className="flex items-center gap-1.5 border-2 border-black bg-accent-purple px-3.5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-black transition-colors cursor-pointer"
                  >
                    <HiPlus className="h-4 w-4" />
                    <span>New Link</span>
                  </button>
                  <button
                    onClick={() => setShowLivePreview(true)}
                    className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <HiOutlineEye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric Stamp Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Active Links
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">
                      {links.filter((l) => l.is_active).length}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">/ {links.length} total</span>
                  </div>
                </div>

                <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Unread Inquiries
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${unreadInquiriesCount > 0 ? "text-accent-purple" : "text-black"}`}>
                      {unreadInquiriesCount}
                    </span>
                    {unreadInquiriesCount > 0 && (
                      <span className="border border-black bg-amber-300 px-1 py-0.2 font-mono text-[9px] font-black text-black">
                        ACTION NEEDED
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Total Click Volume
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-accent-blue">
                      {totalClicks}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">clicks</span>
                  </div>
                </div>

                <div className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Admin Team
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">
                      {users.length > 0 ? users.length : 1}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">leaders</span>
                  </div>
                </div>
              </div>

              {/* Recent Inquiries Preview + Top Links Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Inquiries Card */}
                <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
                    <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <HiOutlineEnvelope className="h-4 w-4 text-accent-purple" />
                      <span>Recent Contact Inquiries</span>
                    </h2>
                    <button
                      onClick={() => setActiveView("inquiries")}
                      className="font-mono text-[11px] font-black uppercase text-accent-purple hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {inquiries.slice(0, 3).map((inq) => (
                      <div
                        key={inq.id}
                        onClick={() => setSelectedInquiry(inq)}
                        className="border-2 border-black bg-zinc-50 p-3 hover:bg-yellow-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-black text-black">{inq.name}</span>
                          <span className={`border border-black px-1.5 py-0.2 font-mono text-[8px] font-black uppercase ${
                            inq.status === "unread" ? "bg-amber-300 text-black" : "bg-zinc-200 text-zinc-700"
                          }`}>
                            {inq.status}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] font-bold text-accent-purple">{inq.category}</p>
                        <p className="text-xs text-zinc-600 line-clamp-1 mt-0.5">{inq.message}</p>
                      </div>
                    ))}

                    {inquiries.length === 0 && (
                      <div className="py-8 text-center font-mono text-xs text-zinc-500">
                        No contact submissions recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Performing Links Card */}
                <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
                    <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <HiOutlineChartBar className="h-4 w-4 text-accent-blue" />
                      <span>Top Performing Links</span>
                    </h2>
                    <button
                      onClick={() => setActiveView("analytics")}
                      className="font-mono text-[11px] font-black uppercase text-accent-blue hover:underline cursor-pointer"
                    >
                      Analytics &rarr;
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {links
                      .slice()
                      .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
                      .slice(0, 3)
                      .map((link) => {
                        const Icon = getIconForPlatform(link.platform);
                        return (
                          <div
                            key={link.id}
                            className="flex items-center justify-between border-2 border-black bg-zinc-50 p-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-7 w-7 items-center justify-center border border-black bg-white">
                                <Icon className="h-3.5 w-3.5 text-black" />
                              </div>
                              <div className="min-w-0">
                                <span className="block font-mono text-xs font-black text-black truncate">
                                  {link.title}
                                </span>
                                <span className="block font-mono text-[10px] text-zinc-500 truncate">
                                  {link.url}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-xs font-black text-black">
                                {link.click_count || 0}
                              </span>
                              <span className="block font-mono text-[8px] uppercase text-zinc-500">clicks</span>
                            </div>
                          </div>
                        );
                      })}

                    {links.length === 0 && (
                      <div className="py-8 text-center font-mono text-xs text-zinc-500">
                        No active links found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW 2: ANALYTICS */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "analytics" && (
            <div className="space-y-6">
              <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
                <div className="mb-1 inline-block border border-black bg-accent-blue px-2 py-0.2 font-mono text-[9px] font-black text-white">
                  // TELEMETRY_AND_CLICKS
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                  Link Analytics &amp; Conversion
                </h1>
                <p className="font-mono text-xs text-zinc-600 mt-0.5">
                  Click-through rates and channel distribution across the AWS SBG platform.
                </p>
              </div>

              {/* Performance Table */}
              <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-black mb-4">
                  Destination Performance Breakdown
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black bg-zinc-100">
                        <th className="p-3 font-black text-black">LINK TITLE</th>
                        <th className="p-3 font-black text-black">PLATFORM</th>
                        <th className="p-3 font-black text-black text-right">TOTAL CLICKS</th>
                        <th className="p-3 font-black text-black text-right">SHARE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-black">
                      {links
                        .slice()
                        .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
                        .map((link) => {
                          const Icon = getIconForPlatform(link.platform);
                          const clicks = link.click_count || 0;
                          const pct = totalClicks > 0 ? ((clicks / totalClicks) * 100).toFixed(1) : "0";
                          return (
                            <tr key={link.id} className="hover:bg-zinc-50">
                              <td className="p-3 font-bold text-black flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{link.title}</span>
                              </td>
                              <td className="p-3 uppercase text-zinc-600">{link.platform}</td>
                              <td className="p-3 text-right font-black text-black">{clicks}</td>
                              <td className="p-3 text-right font-bold text-accent-purple">{pct}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW 3: LINKS MANAGEMENT */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "links" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000]">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-black">
                    Link Card Manager
                  </h1>
                  <span className="font-mono text-xs font-bold text-zinc-600">
                    {links.filter((l) => l.is_active).length} of {links.length} links published on live site
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(null);
                      setShowEditor(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 border-2 border-black bg-black px-3.5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
                  >
                    <HiPlus className="h-3.5 w-3.5" />
                    <span>Add Link Card</span>
                  </button>
                  <button
                    onClick={() => setShowLivePreview(true)}
                    className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                  >
                    <HiOutlineEye className="h-4 w-4" />
                    <span>Simulator</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {links.map((link, index) => {
                  const Icon = getIconForPlatform(link.platform);
                  return (
                    <div
                      key={link.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-3.5 sm:p-4 shadow-[4px_4px_0px_#000000] transition-all ${
                        !link.is_active ? "opacity-60 bg-zinc-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                          <Icon className="h-5 w-5 text-black" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-mono text-sm font-black text-black truncate">
                              {link.title}
                            </h3>
                            {!link.is_active && (
                              <span className="border border-black bg-zinc-200 px-1 py-0.2 font-mono text-[9px] font-black uppercase text-zinc-700">
                                DRAFT
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-zinc-500 truncate max-w-[260px] sm:max-w-[340px]">
                            {link.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t border-black/10 sm:border-0">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <HiOutlineArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === links.length - 1}
                          className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <HiOutlineArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(link)}
                          className={`border-2 border-black px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_#000000] transition-colors cursor-pointer ${
                            link.is_active
                              ? "bg-emerald-300 text-black hover:bg-emerald-400"
                              : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                          }`}
                          title={link.is_active ? "Click to hide" : "Click to show"}
                        >
                          {link.is_active ? "LIVE" : "DRAFT"}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(link);
                            setShowEditor(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                          title="Edit"
                        >
                          <HiOutlinePencilSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id, link.title)}
                          className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-red-600 shadow-[1px_1px_0px_#000000] hover:bg-red-50 cursor-pointer"
                          title="Delete"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {links.length === 0 && (
                <div className="border-[3px] border-dashed border-black bg-white py-16 text-center shadow-[4px_4px_0px_#000000]">
                  <p className="font-mono text-xs font-bold uppercase text-zinc-600">
                    No links currently published. Click &quot;Add Link Card&quot; above to create one.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW 4: INQUIRIES (CONTACT FORM RESPONSES) */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "inquiries" && (
            <div className="space-y-4">
              <div className="border-[3px] border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="mb-1 inline-block border border-black bg-accent-purple px-2 py-0.2 font-mono text-[9px] font-black text-white">
                      // CONTACT_SUBMISSIONS
                    </div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-black">
                      Inquiries &amp; Form Responses
                    </h1>
                    <p className="font-mono text-xs text-zinc-600 mt-0.5">
                      Submissions from awssbg.online/contact sent to lethabomabilo33@gmail.com.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportInquiriesCSV}
                      className="flex items-center gap-1.5 border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      title="Download inquiries as CSV"
                    >
                      <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => fetchInquiries(selectedOrgId)}
                      className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                    >
                      Refresh List
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="mt-4 pt-3 border-t-2 border-black/10 flex flex-wrap gap-2">
                  <select
                    value={inquiryStatusFilter}
                    onChange={(e) => setInquiryStatusFilter(e.target.value)}
                    className="border-2 border-black bg-white px-2.5 py-1 font-mono text-xs font-bold text-black cursor-pointer"
                  >
                    <option value="all">ALL STATUSES</option>
                    <option value="unread">UNREAD ONLY</option>
                    <option value="read">READ</option>
                    <option value="replied">REPLIED</option>
                  </select>

                  <select
                    value={inquiryCategoryFilter}
                    onChange={(e) => setInquiryCategoryFilter(e.target.value)}
                    className="border-2 border-black bg-white px-2.5 py-1 font-mono text-xs font-bold text-black cursor-pointer"
                  >
                    <option value="all">ALL CATEGORIES</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Join Study Jam / Bootcamp">Join Study Jam</option>
                    <option value="Host Workshop / Speaker Request">Speaker Request</option>
                    <option value="University Tech Club Partnership">Club Partnership</option>
                    <option value="Certification Voucher Inquiry">Certification Vouchers</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Inquiries List */}
              <div className="space-y-3">
                {filteredInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000] hover:bg-yellow-50 transition-all cursor-pointer ${
                      inq.status === "unread" ? "border-l-[8px] border-l-amber-400" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-black text-black">
                          {inq.name}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">
                          &lt;{inq.email}&gt;
                        </span>
                        <span className={`border border-black px-1.5 py-0.2 font-mono text-[8px] font-black uppercase ${
                          inq.status === "unread" ? "bg-amber-300 text-black" : inq.status === "replied" ? "bg-emerald-300 text-black" : "bg-zinc-200 text-zinc-700"
                        }`}>
                          {inq.status}
                        </span>
                      </div>
                      <span className="block font-mono text-xs font-bold text-accent-purple mb-0.5">
                        {inq.category}
                      </span>
                      <p className="text-xs text-zinc-700 line-clamp-1">
                        {inq.message}
                      </p>
                    </div>

                    <div className="shrink-0 text-right font-mono text-[10px] text-zinc-500">
                      {new Date(inq.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}

                {filteredInquiries.length === 0 && (
                  <div className="border-[3px] border-dashed border-black bg-white py-16 text-center shadow-[4px_4px_0px_#000000]">
                    <p className="font-mono text-xs font-bold uppercase text-zinc-600">
                      No matching inquiries found in database.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW 5: SETTINGS & TEAM */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "team" && (
            <div className="space-y-6">
              <div className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="mb-1 inline-block border border-black bg-black px-2 py-0.2 font-mono text-[9px] font-black text-white">
                      // ACCESS_CONTROL
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                      Settings &amp; Team Leadership
                    </h1>
                    <p className="font-mono text-xs text-zinc-600 mt-0.5">
                      Role-based access management for AWS SBG student leaders.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <button
                        onClick={() => setShowAddOrgModal(true)}
                        className="inline-flex items-center justify-center gap-1.5 border-2 border-black bg-black px-3.5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        <HiPlus className="h-4 w-4" />
                        <span>Add New SBG</span>
                      </button>
                    )}
                    {(isSuperAdmin || currentUserRole === "leader") && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center justify-center gap-1.5 border-2 border-black bg-accent-purple px-3.5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        <HiOutlineUserPlus className="h-4 w-4" />
                        <span>Invite Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Team list */}
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-3.5 sm:p-4 shadow-[4px_4px_0px_#000000]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-black text-white font-mono font-black text-sm shadow-[2px_2px_0px_#7C3AED]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-sm font-black text-black truncate">
                            {user.name}
                          </h3>
                          <span
                            className={`border border-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase ${
                              user.is_super_admin
                                ? "bg-accent-purple text-white shadow-[1px_1px_0px_#000000]"
                                : "bg-zinc-100 text-black"
                            }`}
                          >
                            {user.is_super_admin ? "SUPERADMIN" : user.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-zinc-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t border-black/10 sm:border-0">
                      {!user.is_super_admin && user.email !== "lethabomabilo33@gmail.com" ? (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="inline-flex items-center gap-1 border-2 border-black bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-red-600 shadow-[1px_1px_0px_#000000] hover:bg-red-50 cursor-pointer"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-zinc-400">
                          PRIMARY OWNER
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Settings Sub-section embedded within Users & Roles */}
              <div className="mt-8 pt-6 border-t-2 border-black/20">
                <div className="mb-4">
                  <div className="mb-1 inline-block border border-black bg-zinc-100 px-2 py-0.2 font-mono text-[9px] font-black uppercase text-black">
                    // SBG_SETTINGS
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black">
                    SBG Settings &amp; Public Identity
                  </h3>
                  <p className="font-mono text-xs text-zinc-600 mt-0.5">
                    Customize the public hero headlines, cover imagery, and official contact recipient.
                  </p>
                </div>
                <OrgSettingsView
                  currentOrgId={selectedOrgId}
                  actorId={currentUserId}
                  actorName={currentUserName || currentUserEmail}
                  isSuperAdmin={isSuperAdmin}
                  userRole={currentUserRole}
                />
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW: ANNOUNCEMENTS */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "announcements" && (
            <AnnouncementManager
              currentOrgId={selectedOrgId}
              actorId={currentUserId}
              actorName={currentUserName || currentUserEmail}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW: EVENTS & TICKETING LOGISTICS */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "events" && (
            <EventsManager
              currentOrgId={selectedOrgId}
              actorId={currentUserId}
              actorName={currentUserName || currentUserEmail}
              isSuperAdmin={isSuperAdmin}
              token={sessionToken}
            />
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW: BLOG POSTS */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "posts" && (
            <BlogManager
              currentOrgId={selectedOrgId}
              actorId={currentUserId}
              actorName={currentUserName || currentUserEmail}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW: MEET THE TEAM */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "team_page" && (
            <TeamPageManager
              currentOrgId={selectedOrgId}
              actorId={currentUserId}
              actorName={currentUserName || currentUserEmail}
              isSuperAdmin={isSuperAdmin}
            />
          )}


          {/* ═════════════════════════════════════════════════════════ */}
          {/* VIEW: ACTIVITY LOG */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeView === "activity" && (
            <ActivityLogView
              currentOrgId={selectedOrgId}
              isSuperAdmin={isSuperAdmin}
            />
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      {showEditor && (
        <LinkEditor
          link={editing}
          onSave={handleSaveLink}
          onCancel={() => {
            setShowEditor(false);
            setEditing(null);
          }}
        />
      )}

      {showAddOrgModal && isSuperAdmin && (
        <AddNewSbgModal
          token={sessionToken}
          onClose={() => setShowAddOrgModal(false)}
          onOrgCreated={async () => {
            const { data: orgsData } = await supabase
              .from("orgs")
              .select("*")
              .order("name", { ascending: true });
            if (orgsData) {
              setOrgs(orgsData as Organization[]);
            }
          }}
        />
      )}

      {showInviteModal && (isSuperAdmin || currentUserRole === "leader") && (
        <InviteUserModal
          token={sessionToken}
          orgs={orgs}
          defaultOrgId={selectedOrgId}
          onClose={() => setShowInviteModal(false)}
          onUserInvited={() => fetchUsers(sessionToken)}
        />
      )}

      {showPasswordModal && (
        <PasswordUpdateModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showLivePreview && (
        <LivePreviewModal links={links} onClose={() => setShowLivePreview(false)} />
      )}

      {selectedInquiry && (
        <InquiryModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusChange={handleInquiryStatusChange}
          onDelete={handleDeleteInquiry}
        />
      )}
    </div>
  );
}

// ── Page Root ──
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [mustSetPassword, setMustSetPassword] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const checkInviteOrRecovery = useCallback((session: any) => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const hasInviteFlag = hash.includes("type=invite") || search.includes("type=invite");
    const hasRecoveryFlag = hash.includes("type=recovery") || search.includes("type=recovery");

    // Intercept if user was invited and hasn't flagged password_set in metadata
    const isUnsetInvitedUser =
      Boolean(session?.user?.invited_at) && session?.user?.user_metadata?.password_set !== true;

    return hasInviteFlag || hasRecoveryFlag || isUnsetInvitedUser;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      if (session?.user) {
        setUserEmail(session.user.email || "");
        if (checkInviteOrRecovery(session)) {
          setMustSetPassword(true);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthed(!!session);
      if (session?.user) {
        setUserEmail(session.user.email || "");
        if (
          event === "PASSWORD_RECOVERY" ||
          event === "USER_UPDATED" ||
          event === "SIGNED_IN" ||
          checkInviteOrRecovery(session)
        ) {
          if (checkInviteOrRecovery(session)) {
            setMustSetPassword(true);
          }
        }
      } else {
        setUserEmail("");
        setMustSetPassword(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkInviteOrRecovery]);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F5]">
        <div className="h-6 w-6 animate-spin border-2 border-black border-t-accent-purple" />
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  // 🔒 MANDATORY SECURITY GATEWAY: Intercept if user arrived via invite/recovery, or hasn't configured password
  if (mustSetPassword) {
    return (
      <ForceSetPasswordScreen
        email={userEmail}
        onComplete={() => setMustSetPassword(false)}
      />
    );
  }

  return <Dashboard />;
}
