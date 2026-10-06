"use client";

/**
 * Dedicated Password Configuration Gateway — AWS Student Builder Group.
 * Geometry: 0px razor-sharp corners, 3px solid #000000 ink borders, hard offset shadows.
 * Zero Emojis. Pure Black, Pure White, AWS Electric Purple (#7C3AED).
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@awssbg/shared";
import {
  HiCheck,
  HiXMark,
  HiEye,
  HiEyeSlash,
  HiExclamationTriangle,
  HiCheckCircle,
} from "react-icons/hi2";

const MIN_PASSWORD_LENGTH = 8;

// ── Live password requirement row (PRD §9.4) ──
function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 font-mono text-[11px] font-bold">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 border-black ${
          met ? "bg-[#7C3AED] text-white" : "bg-white text-black"
        }`}
        aria-hidden="true"
      >
        {met ? <HiCheck className="h-3 w-3" /> : <HiXMark className="h-3 w-3" />}
      </span>
      <span className={met ? "text-black" : "text-zinc-500"}>{label}</span>
      <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
    </li>
  );
}

// ── User-Friendly Error Sanitizer ──
const EXPIRED_INVITE_MSG = "This invitation has expired. Ask a Super Admin to send you a new invitation.";
const USED_INVITE_MSG =
  "This invitation link has already been used. If you already set your password, sign in normally. Otherwise ask a Super Admin to resend your invitation.";

// Maps Supabase redirect errors (URL hash: error_code / error_description) to safe copy.
function formatLinkError(code: string | null, desc: string | null): string {
  const c = (code || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  if (c === "otp_expired" || d.includes("expired")) return EXPIRED_INVITE_MSG;
  if (c.includes("already") || d.includes("already") || d.includes("used") || c === "access_denied") return USED_INVITE_MSG;
  return "This invitation link is invalid. Ask a Super Admin to send you a new invitation.";
}

function formatUserError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  const msg = typeof err === "string" ? err : (err as Error).message || fallback;
  const lower = msg.toLowerCase();

  if (lower.includes("service_role") || lower.includes("service role")) {
    return "Server configuration is finalizing. Please try again in a moment.";
  }
  if (lower.includes("password should be at least")) {
    return "Password is too short. It must contain at least 8 characters.";
  }
  if (lower.includes("should be different") || lower.includes("same password")) {
    return "Your account is already set up with this password. Sign in normally, or choose a different password.";
  }
  if (lower.includes("weak") || lower.includes("pwned") || lower.includes("compromised")) {
    return "This password is too weak or has appeared in a data breach. Please choose a different one.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Request limit reached. Please wait a few minutes before trying again.";
  }
  if (lower.includes("already") || lower.includes("used")) {
    return USED_INVITE_MSG;
  }
  if (lower.includes("jwt") || lower.includes("expired") || lower.includes("invalid") || lower.includes("otp")) {
    return EXPIRED_INVITE_MSG;
  }

  // Never surface raw auth/database errors to the user
  return fallback;
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // "invite" = first-time account setup; "recovery" = forgotten password reset
  const [flowType, setFlowType] = useState<"invite" | "recovery">("invite");

  const lengthOk = newPassword.length >= MIN_PASSWORD_LENGTH;
  const matchOk = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = lengthOk && matchOk && !loading;
  const isInvite = flowType === "invite";

  useEffect(() => {
    // 1. Check for errors or tokens in URL hash immediately
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const queryType = new URLSearchParams(window.location.search).get("type");
      if (queryType === "recovery") setFlowType("recovery");
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        if (hashParams.get("type") === "recovery") setFlowType("recovery");
        const errorDesc = hashParams.get("error_description");
        const errorCode = hashParams.get("error_code") || hashParams.get("error");
        if (errorDesc || errorCode) {
          setSessionError(formatLinkError(errorCode, errorDesc));
          setVerifying(false);
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          supabase.auth
            .setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(({ data, error }) => {
              if (data?.session?.user) {
                setUserEmail(data.session.user.email || null);
                setVerifying(false);
                setSessionError(null);
              } else if (error) {
                setSessionError(formatUserError(error, "Failed to establish verification session."));
                setVerifying(false);
              }
            });
        }
      }
    }

    // 2. Check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
            if (retrySession?.user) {
              setUserEmail(retrySession.user.email || null);
              setVerifying(false);
            } else {
              setSessionError((prev) =>
                prev ||
                "Invalid or expired verification session. Please request a new invitation or password reset."
              );
              setVerifying(false);
            }
          });
        }, 1000);
      } else {
        setUserEmail(session.user.email || null);
        setVerifying(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        setVerifying(false);
        setSessionError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { password_set: true },
      });

      if (error) {
        throw error;
      }

      // Clear tokens from URL bar immediately
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Dispatch security notification
      if (userEmail) {
        fetch("/api/notify-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "password_changed", email: userEmail }),
        }).catch(() => {});
      }

      // Explicitly sign out so user signs in normally with their new credentials
      await supabase.auth.signOut();

      setIsDone(true);
      toast.success(isInvite ? "Password created successfully!" : "Password updated successfully!", {
        description: "Please sign in with your email and new password.",
      });

      // Redirect into login screen with prefilled email
      const targetUrl = `/?email=${encodeURIComponent(userEmail || "")}&setup=success`;
      setTimeout(() => {
        router.push(targetUrl);
      }, 2000);
    } catch (err) {
      toast.error("Failed to update password", {
        description: formatUserError(err, "Unable to establish credentials. Please try again."),
      });
      setLoading(false);
    }
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] p-4 sm:p-6">
      <main className="w-full max-w-md border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
        {/* Header Branding */}
        <header className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-[3px] border-black bg-white p-1.5 shadow-[3px_3px_0px_#000000]">
              <Image
                src="/logo.png"
                alt="AWS Student Builder Group logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              AWS Student Builder Group
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            {isInvite ? "Complete your account" : "Reset your password"}
          </h1>
          <p className="mt-1 font-mono text-xs font-medium text-zinc-600">
            {isInvite
              ? "You've been invited to the AWS SBG admin console. Create your own password to finish setting up your account."
              : "Choose a new password for your AWS SBG account."}
          </p>
        </header>

        {/* Loading / Verifying State */}
        {verifying && (
          <div className="flex flex-col items-center justify-center py-8" role="status" aria-live="polite">
            <div className="h-6 w-6 animate-spin border-[3px] border-black border-t-[#7C3AED]" />
            <p className="mt-3 font-mono text-xs font-bold text-zinc-600">
              {isInvite ? "Verifying your invitation..." : "Verifying your reset link..."}
            </p>
          </div>
        )}

        {/* Session Error State */}
        {!verifying && sessionError && (
          <div className="space-y-4" role="alert">
            <div className="flex gap-3 border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#000000]">
              <HiExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
              <p className="font-mono text-xs font-bold text-black">{sessionError}</p>
            </div>
            <a
              href="/"
              className="block w-full border-[3px] border-black bg-black py-3 text-center font-mono text-xs font-black uppercase text-white shadow-[4px_4px_0px_#7C3AED] transition-colors hover:bg-[#7C3AED] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Go to sign in
            </a>
          </div>
        )}

        {/* Success State */}
        {!verifying && isDone && (
          <div className="space-y-4 py-2" role="status" aria-live="polite">
            <div className="flex gap-3 border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_#7C3AED]">
              <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7C3AED]" aria-hidden="true" />
              <div className="font-mono text-xs font-bold text-black">
                <p className="text-sm font-black uppercase tracking-tight">
                  {isInvite ? "Password created successfully!" : "Password updated successfully!"}
                </p>
                <p className="mt-1.5 font-medium text-zinc-600">
                  Your credentials are now configured. Please sign in with <strong>{userEmail ?? "your email"}</strong> and your newly created password.
                </p>
              </div>
            </div>
            <a
              href={`/?email=${encodeURIComponent(userEmail || "")}&setup=success`}
              className="block w-full border-[3px] border-black bg-black py-3 text-center font-mono text-xs font-black uppercase text-white shadow-[4px_4px_0px_#7C3AED] transition-colors hover:bg-[#7C3AED] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Proceed to Sign In &rarr;
            </a>
            <div className="flex items-center justify-center gap-2 font-mono text-[11px] font-bold text-zinc-600">
              <div className="h-4 w-4 animate-spin border-2 border-black border-t-[#7C3AED]" />
              Redirecting to sign-in page...
            </div>
          </div>
        )}

        {/* Password Form */}
        {!verifying && !sessionError && !isDone && (
          <form onSubmit={handleSetPassword} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={userEmail ?? ""}
                readOnly
                aria-readonly="true"
                className="w-full cursor-not-allowed border-[3px] border-black bg-zinc-100 px-3.5 py-2 font-mono text-sm text-zinc-700 outline-none"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
                {isInvite ? "Create password" : "New password"}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-describedby="password-requirements"
                  className="w-full border-[3px] border-black bg-white py-2 pl-3.5 pr-11 font-mono text-sm text-black outline-none focus:shadow-[4px_4px_0px_#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center border-l-[3px] border-black text-black hover:bg-[#7C3AED] hover:text-white cursor-pointer"
                >
                  {showPassword ? <HiEyeSlash className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block font-mono text-xs font-black uppercase tracking-wider text-black">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={confirmPassword.length > 0 && !matchOk}
                className="w-full border-[3px] border-black bg-white px-3.5 py-2 font-mono text-sm text-black outline-none focus:shadow-[4px_4px_0px_#7C3AED]"
              />
            </div>

            <div id="password-requirements" className="border-[3px] border-black bg-white p-3">
              <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-black">
                Password requirements
              </p>
              <ul className="space-y-1.5" aria-live="polite">
                <Requirement met={lengthOk} label={`At least ${MIN_PASSWORD_LENGTH} characters`} />
                <Requirement met={matchOk} label="Passwords match" />
              </ul>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full border-[3px] border-black bg-black py-3 font-mono text-xs font-black uppercase text-white shadow-[4px_4px_0px_#7C3AED] transition-colors hover:bg-[#7C3AED] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black cursor-pointer"
            >
              {loading ? "Saving password..." : isInvite ? "Create password" : "Update password"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
