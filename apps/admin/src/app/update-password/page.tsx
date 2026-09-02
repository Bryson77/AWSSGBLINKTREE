"use client";

/**
 * Dedicated Password Configuration Gateway — AWS Student Builder Group.
 * Geometry: 0px razor-sharp corners, 3px solid #000000 ink borders, hard offset shadows.
 * Zero Emojis. Pure Black, Pure White, AWS Electric Purple (#7C3AED).
 */

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@awssbg/shared";

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
      label = "EMPTY";
      color = "bg-zinc-200 text-zinc-600";
      activeBars = 0;
    } else if (score === 1) {
      label = "WEAK";
      color = "bg-orange-500 text-white";
      activeBars = 1;
    } else if (score === 2) {
      label = "FAIR";
      color = "bg-amber-400 text-black";
      activeBars = 2;
    } else if (score === 3) {
      label = "STRONG";
      color = "bg-emerald-500 text-white";
      activeBars = 3;
    } else if (score >= 4) {
      label = "VERY STRONG";
      color = "bg-[#7C3AED] text-white";
      activeBars = 4;
    }

    return { score, label, color, activeBars, checks };
  }, [password]);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase">
        <span className="text-zinc-500">Security Strength:</span>
        <span className={`border border-black px-1.5 py-0.2 font-black ${analysis.color}`}>
          {analysis.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 border border-black transition-colors ${
              bar <= analysis.activeBars ? analysis.color.split(" ")[0] : "bg-zinc-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── User-Friendly Error Sanitizer ──
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
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Request limit reached. Please wait a few minutes before trying again.";
  }
  if (lower.includes("jwt") || lower.includes("expired") || lower.includes("invalid")) {
    return "Your verification link has expired. Please request a new invitation.";
  }

  return msg;
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

  useEffect(() => {
    // 1. Check for errors or tokens in URL hash immediately
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const errorDesc = hashParams.get("error_description");
        if (errorDesc) {
          setSessionError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
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

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
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

      setIsDone(true);
      toast.success("Master password configured successfully!", {
        description: "Your admin account is now fully active. Loading console...",
      });

      // Clear tokens from URL bar
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

      // Redirect into main dashboard
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      toast.error("Failed to update password", {
        description: formatUserError(err, "Unable to establish credentials. Please try again."),
      });
      setLoading(false);
    }
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] p-4 sm:p-6">
      <div className="w-full max-w-md border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
        {/* Header Branding */}
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
            // SECURITY_GATEWAY // AUTH_CONFIG
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            Configure Password
          </h1>
          <p className="mt-1 font-mono text-xs font-medium text-zinc-600">
            Welcome to the AWS SBG Admin Console. Set a master password to activate your account.
          </p>

          {userEmail && (
            <div className="mt-3 border border-black bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-bold text-black">
              Account: {userEmail}
            </div>
          )}
        </div>

        {/* Loading / Verifying State */}
        {verifying && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin border-2 border-black border-t-accent-purple" />
            <p className="mt-3 font-mono text-xs font-bold text-zinc-600">
              Verifying security token...
            </p>
          </div>
        )}

        {/* Session Error State */}
        {!verifying && sessionError && (
          <div className="space-y-4">
            <div className="border-2 border-black bg-red-50 p-4 font-mono text-xs font-bold text-red-700">
              {sessionError}
            </div>
            <a
              href="/"
              className="block w-full border-2 border-black bg-black py-2.5 text-center font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-zinc-800"
            >
              Return to Login &rarr;
            </a>
          </div>
        )}

        {/* Success State */}
        {!verifying && isDone && (
          <div className="space-y-3 py-4 text-center">
            <div className="border-2 border-black bg-emerald-50 p-4 font-mono text-xs font-bold text-emerald-800">
              Credentials activated. Launching AWS SBG Management Console...
            </div>
            <div className="flex justify-center">
              <div className="h-5 w-5 animate-spin border-2 border-black border-t-emerald-600" />
            </div>
          </div>
        )}

        {/* Password Form */}
        {!verifying && !sessionError && !isDone && (
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
        )}
      </div>
    </div>
  );
}
