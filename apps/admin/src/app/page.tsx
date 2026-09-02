"use client";

/**
 * awssbg Admin — Dedicated Cloud Management Console (Standalone App).
 * Geometry: 0px sharp corners, 3px solid black borders, hard drop shadows.
 * Authentication: Supabase email/password, magic link, password recovery.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase, LinkItem, getIconForPlatform } from "@awssbg/shared";
import {
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiPlus,
  HiOutlineUserGroup,
  HiOutlineKey,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineQrCode,
  HiOutlineUserPlus,
} from "react-icons/hi2";

const PLATFORMS = [
  "meetup",
  "whatsapp",
  "linkedin",
  "instagram",
  "x",
  "discord",
  "github",
  "youtube",
  "tiktok",
  "aws",
  "medium",
  "devto",
  "hashnode",
  "facebook",
  "telegram",
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

      {/* Segmented Meter */}
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

      {/* Rules Checklist */}
      <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-zinc-700 pt-1">
        <div className={`flex items-center gap-1 ${analysis.checks.length8 ? "text-emerald-700 font-bold" : ""}`}>
          {analysis.checks.length8 ? <HiOutlineCheck className="h-3 w-3" /> : <HiOutlineXMark className="h-3 w-3" />}
          <span>Min 8 characters</span>
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
  const [mode, setMode] = useState<"password" | "magic" | "recovery">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Authentication failed", { description: error.message });
        setLoading(false);
      } else {
        toast.success("Welcome back!", { description: "Authenticated as " + email });
        onLogin();
      }
    } else if (mode === "magic") {
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : "https://admin.awssbg.online";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
      });

      if (error) {
        toast.error("Failed to send login link", { description: error.message });
      } else {
        toast.success("Login link dispatched!", {
          description: "Check your email inbox for your secure sign-in link.",
        });
      }
      setLoading(false);
    } else if (mode === "recovery") {
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : "https://admin.awssbg.online";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error("Password recovery failed", { description: error.message });
      } else {
        toast.success("Password reset email sent!", {
          description: "Check your inbox for the reset link powered by Resend.",
        });
        setMode("password");
      }
      setLoading(false);
    }
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] px-5 py-10">
      <div className="w-full max-w-sm border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_#000000]">
        <div className="mb-6 text-center">
          {/* Boxed Chip Logo Stamp */}
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center border-2 border-black bg-white p-2 shadow-[3px_3px_0px_#000000]">
            <Image
              src="/logo.png"
              alt="AWS SBG Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="mb-2 inline-block border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-white shadow-[1px_1px_0px_#7C3AED]">
            // ADMIN_PORTAL
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            awssbg Admin
          </h1>
          <p className="mt-0.5 font-mono text-xs font-semibold text-zinc-600">
            {mode === "password" && "Authenticate to manage links"}
            {mode === "magic" && "Sign in via magic link"}
            {mode === "recovery" && "Request password reset"}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mb-5 flex border-2 border-black bg-zinc-100 p-1">
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
              Email
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
                  className="font-mono text-[10px] font-bold text-zinc-500 underline hover:text-accent-purple"
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
            className="w-full border-2 border-black bg-black py-3 font-mono text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0px_#7C3AED] transition-all hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000]"
      >
        <div className="border-b-2 border-black pb-3">
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            {isEditing ? "Edit Link Item" : "Create New Link"}
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
            className="w-full border-2 border-black bg-white px-3.5 py-2 text-sm font-semibold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
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
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200 active:translate-x-[1px] active:translate-y-[1px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
  onClose,
  onUserInvited,
}: {
  token: string;
  onClose: () => void;
  onUserInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      toast.success("User invited successfully!", {
        description: `Invitation dispatched to ${email}. They can now set their password.`,
      });
      onUserInvited();
      onClose();
    } catch (err) {
      toast.error("Invitation failed", { description: (err as Error).message });
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
            // SUPERADMIN_ACCESS
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

        <div>
          <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
            Access Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-sm font-bold text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
          >
            <option value="admin">ADMIN (Manage Links & Content)</option>
            <option value="editor">EDITOR (View & Edit Links)</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50"
          >
            {loading ? "Sending Invite…" : "Send Invite Email →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── MFA Authenticator Setup Modal ──
function MfaSetupModal({ onClose }: { onClose: () => void }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function startEnrollment() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "awssbg.online",
      });

      if (error) {
        toast.error("MFA Enrollment Error", { description: error.message });
      } else if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);
        setQrCode(data.totp.qr_code);
      }
    }
    startEnrollment();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !verifyCode.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: verifyCode.trim(),
    });

    if (error) {
      toast.error("Verification failed", { description: error.message });
      setLoading(false);
    } else {
      toast.success("2FA Authenticator activated successfully!", {
        description: "Your admin account is now hardened with TOTP verification.",
      });
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs">
      <div className="w-full max-w-sm border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000]">
        <div className="border-b-2 border-black pb-3">
          <div className="mb-1 inline-block border border-black bg-accent-purple px-2 py-0.2 font-mono text-[9px] font-black text-white">
            // HARDENED_SECURITY
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Setup 2FA TOTP
          </h2>
          <p className="font-mono text-xs font-medium text-zinc-600">
            Scan with Google Authenticator or 1Password.
          </p>
        </div>

        {qrCode ? (
          <div className="my-4 flex flex-col items-center">
            <div
              className="border-2 border-black p-2 bg-white shadow-[2px_2px_0px_#000000]"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            {secret && (
              <p className="mt-2 font-mono text-[10px] text-zinc-600 select-all">
                Key: <code className="font-bold text-black">{secret}</code>
              </p>
            )}
          </div>
        ) : (
          <div className="my-6 flex justify-center">
            <div className="h-6 w-6 animate-spin border-2 border-black border-t-accent-purple" />
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
              Enter 6-Digit Auth Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="w-full border-2 border-black bg-white px-3.5 py-2 font-mono text-center text-lg font-black tracking-widest text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-black hover:bg-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || verifyCode.length < 6}
              className="flex-1 border-2 border-black bg-black px-3 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Enable 2FA →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Password Reset / Update Modal (With Live Strength Ranking) ──
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
      toast.error("Password update failed", { description: error.message });
      setLoading(false);
    } else {
      toast.success("Password updated successfully!", {
        description: "Your new password is now active.",
      });
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-xs">
      <form
        onSubmit={handleUpdatePassword}
        className="w-full max-w-sm space-y-4 border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000]"
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
            className="flex-1 border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200"
          >
            Later
          </button>
          <button
            type="submit"
            disabled={loading || newPassword.length < 8}
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update Password →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Admin Dashboard ──
function Dashboard() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<LinkItem> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"links" | "team">("links");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");

  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast.error("Failed to load links", { description: error.message });
    } else if (data) {
      setLinks(data as LinkItem[]);
    }
    setLoading(false);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const email = session.user.email || "";
        setCurrentUserEmail(email);
        setSessionToken(session.access_token);

        const isSuper =
          (session.user as unknown as { is_super_admin?: boolean }).is_super_admin === true ||
          email === "lethabomabilo33@gmail.com" ||
          session.user.app_metadata?.role === "superadmin";

        setIsSuperAdmin(isSuper);
        if (isSuper) {
          fetchUsers(session.access_token);
        }
      }
    });

    fetchLinks();
  }, [fetchLinks, fetchUsers]);

  async function handleSave(data: Partial<LinkItem>) {
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabase.from("links").update(rest).eq("id", id);
      if (error) {
        toast.error("Failed to update link", { description: error.message });
      } else {
        toast.success("Link updated successfully!");
        fetchLinks();
      }
    } else {
      const maxOrder =
        links.length > 0 ? Math.max(...links.map((l) => l.sort_order)) : 0;
      const { error } = await supabase
        .from("links")
        .insert({ ...data, sort_order: maxOrder + 1 });

      if (error) {
        toast.error("Failed to create link", { description: error.message });
      } else {
        toast.success("Link created successfully!");
        fetchLinks();
      }
    }
    setEditing(null);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete link", { description: error.message });
    } else {
      toast.success("Link deleted");
      fetchLinks();
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
      toast.error("Delete failed", { description: (err as Error).message });
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
          <p className="font-mono text-xs font-bold uppercase text-black">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="brutal-grid-bg min-h-screen bg-[#F4F4F5] px-3.5 sm:px-5 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header Console Box */}
        <div className="mb-5 sm:mb-6 border-[3px] border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center border-2 border-black bg-white p-1.5 shadow-[2px_2px_0px_#000000]">
                <Image
                  src="/logo.png"
                  alt="AWS SBG Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                    awssbg Admin
                  </h1>
                  {isSuperAdmin && (
                    <span className="border border-black bg-accent-purple px-1.5 sm:px-2 py-0.2 font-mono text-[9px] sm:text-[10px] font-black text-white shadow-[1px_1px_0px_#000000]">
                      SUPERADMIN
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[11px] sm:text-xs text-zinc-600 truncate max-w-[280px]">
                  {currentUserEmail}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                title="Update Password"
                className="border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100"
              >
                <HiOutlineKey className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowMfaModal(true)}
                title="Setup 2FA TOTP"
                className="border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100"
              >
                <HiOutlineQrCode className="h-4 w-4" />
              </button>
              <a
                href="https://awssbg.online"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100"
              >
                Public ↗
              </a>
              <button
                onClick={handleLogout}
                className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-zinc-600 hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex border-t-2 border-black/10 pt-3 gap-2">
            <button
              onClick={() => setActiveTab("links")}
              className={`px-3 py-1 font-mono text-xs font-black uppercase transition-all ${
                activeTab === "links"
                  ? "border-2 border-black bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                  : "border-2 border-transparent text-zinc-600 hover:text-black"
              }`}
            >
              Links ({links.length})
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("team")}
                className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-black uppercase transition-all ${
                  activeTab === "team"
                    ? "border-2 border-black bg-black text-white shadow-[2px_2px_0px_#7C3AED]"
                    : "border-2 border-transparent text-zinc-600 hover:text-black"
                }`}
              >
                <HiOutlineUserGroup className="h-3.5 w-3.5" />
                <span>Team &amp; Users ({users.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Links Management */}
        {activeTab === "links" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-xs font-bold text-zinc-600">
                {links.filter((l) => l.is_active).length} of {links.length} published on live site
              </span>
              <button
                onClick={() => {
                  setEditing(null);
                  setShowEditor(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple"
              >
                <HiPlus className="h-3.5 w-3.5" />
                <span>Add Link Card</span>
              </button>
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
                        className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 disabled:opacity-30"
                        title="Move Up"
                      >
                        <HiOutlineArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === links.length - 1}
                        className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 disabled:opacity-30"
                        title="Move Down"
                      >
                        <HiOutlineArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(link)}
                        className={`border-2 border-black px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_#000000] transition-colors ${
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
                        className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100"
                        title="Edit"
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id, link.title)}
                        className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-red-600 shadow-[1px_1px_0px_#000000] hover:bg-red-50"
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

        {/* TAB 2: Superadmin Team & Users */}
        {activeTab === "team" && isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="font-mono text-xs font-bold text-zinc-600">
                Authorized Team Members ({users.length})
              </span>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center justify-center gap-1.5 border-2 border-black bg-accent-purple px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-black"
              >
                <HiOutlineUserPlus className="h-4 w-4" />
                <span>Invite User</span>
              </button>
            </div>

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
                        className="inline-flex items-center gap-1 border-2 border-black bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-red-600 shadow-[1px_1px_0px_#000000] hover:bg-red-50"
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
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditor && (
        <LinkEditor
          link={editing}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditing(null);
          }}
        />
      )}

      {showInviteModal && isSuperAdmin && (
        <InviteUserModal
          token={sessionToken}
          onClose={() => setShowInviteModal(false)}
          onUserInvited={() => fetchUsers(sessionToken)}
        />
      )}

      {showMfaModal && <MfaSetupModal onClose={() => setShowMfaModal(false)} />}

      {showPasswordModal && (
        <PasswordUpdateModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

// ── Page Root ──
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthed(!!session);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  return (
    <>
      <Dashboard />
      {isRecovery && (
        <PasswordUpdateModal onClose={() => setIsRecovery(false)} />
      )}
    </>
  );
}
