"use client";

/**
 * awssbg Admin — Dedicated Cloud Management Console (Standalone App).
 * Geometry: 0px sharp corners, 3px solid black borders, hard drop shadows.
 * Authentication: Supabase email/password, magic link, password recovery.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase, LinkItem, getIconForPlatform } from "@awssbg/shared";
import {
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiPlus,
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
            <span>Visit Public Linktree ↗</span>
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
            Publish on live Linktree [ACTIVE]
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

// ── Main Admin Dashboard ──
function Dashboard() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<LinkItem> | null>(null);
  const [showEditor, setShowEditor] = useState(false);

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

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function handleSave(data: Partial<LinkItem>) {
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabase.from("links").update(rest).eq("id", id);
      if (error) {
        toast.error("Failed to update link", { description: error.message });
      } else {
        toast.success("Link updated successfully!");
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
        toast.success("New link added!");
      }
    }
    setShowEditor(false);
    setEditing(null);
    fetchLinks();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete link", { description: error.message });
    } else {
      toast.success("Link deleted", { description: `Removed "${title}"` });
      fetchLinks();
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
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white p-1 shadow-[2px_2px_0px_#000000]">
                <Image
                  src="/logo.png"
                  alt="AWS SBG Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                    awssbg Admin
                  </h1>
                  <span className="border border-black bg-accent-purple px-1.5 sm:px-2 py-0.2 font-mono text-[9px] sm:text-[10px] font-black text-white shadow-[1px_1px_0px_#000000]">
                    CMS
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[11px] sm:text-xs text-zinc-600">
                  {links.length} total links •{" "}
                  {links.filter((l) => l.is_active).length} live
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://awssbg.online"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none text-center border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] transition-all hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                Public ↗
              </a>
              <button
                onClick={() => {
                  setEditing(null);
                  setShowEditor(true);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] transition-all hover:bg-accent-purple active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <HiPlus className="h-3.5 w-3.5" />
                <span>Add Link</span>
              </button>
              <button
                onClick={handleLogout}
                className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Link List */}
        <div className="space-y-3">
          {links.map((link, index) => {
            const Icon = getIconForPlatform(link.platform);
            return (
              <div
                key={link.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-black bg-white p-3 sm:p-3.5 shadow-[3px_3px_0px_#000000] transition-all ${
                  !link.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Platform Icon Stamp */}
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-black bg-zinc-100 text-black">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] sm:text-sm font-black uppercase tracking-tight text-black">
                        {link.title}
                      </p>
                      {!link.is_active && (
                        <span className="border border-black bg-zinc-200 px-1.5 py-0.2 font-mono text-[9px] font-bold text-zinc-600">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <p className="truncate font-mono text-[11px] sm:text-xs text-zinc-500">{link.url}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 border-zinc-100 pt-2 sm:pt-0">
                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="border border-black bg-white p-1.5 text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 disabled:opacity-20 active:translate-x-[1px] active:translate-y-[1px]"
                    aria-label="Move up"
                    title="Move up"
                  >
                    <HiOutlineArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === links.length - 1}
                    className="border border-black bg-white p-1.5 text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100 disabled:opacity-20 active:translate-x-[1px] active:translate-y-[1px]"
                    aria-label="Move down"
                    title="Move down"
                  >
                    <HiOutlineArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`border border-black px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[1px_1px_0px_#000000] transition-colors ${
                      link.is_active
                        ? "bg-emerald-300 text-black hover:bg-emerald-400"
                        : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                    }`}
                    title={link.is_active ? "Click to hide" : "Click to show"}
                  >
                    {link.is_active ? "LIVE" : "DRAFT"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditing(link);
                      setShowEditor(true);
                    }}
                    className="border border-black bg-white p-1.5 text-black shadow-[1px_1px_0px_#000000] hover:bg-zinc-100"
                    aria-label="Edit link"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(link.id, link.title)}
                    className="border border-black bg-white p-1.5 text-red-600 shadow-[1px_1px_0px_#000000] hover:bg-red-50"
                    aria-label="Delete link"
                    title="Delete"
                  >
                    <HiOutlineTrash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className="border-[3px] border-dashed border-black bg-white py-16 text-center shadow-[4px_4px_0px_#000000]">
            <p className="font-mono text-xs font-bold uppercase text-zinc-600">
              No links currently published. Click &quot;Add Link&quot; above to create one.
            </p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
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
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
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
          <p className="font-mono text-xs text-zinc-600">
            Enter your new password below.
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
            disabled={loading}
            className="flex-1 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] transition-all hover:bg-accent-purple disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update Password →"}
          </button>
        </div>
      </form>
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
