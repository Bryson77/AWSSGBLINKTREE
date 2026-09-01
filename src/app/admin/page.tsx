"use client";

/**
 * Admin page — Light mode with Black & White primary, Purple & Blue accents.
 * Authentication: Supabase email/password auth.
 * Full CRUD + Sonner toast feedback.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { LinkItem } from "@/data/links";
import { getIconForPlatform } from "@/lib/icons";
import {
  HiArrowLeft,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiPlus,
} from "react-icons/hi2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [email, setEmail] = useState("lethabomabilo33@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Authentication failed", {
        description: error.message,
      });
      setLoading(false);
    } else {
      toast.success("Welcome back!", {
        description: "Logged in as " + email,
      });
      onLogin();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-5">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
            <Image
              src="/logo.png"
              alt="AWS SBG Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-[#0A0A0A]">Admin Sign In</h1>
          <p className="mt-1 text-xs text-zinc-500">
            AWS SBG @ TUT Linktree Manager
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-accent-purple focus:ring-1 focus:ring-accent-purple"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-accent-purple focus:ring-1 focus:ring-accent-purple"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0A0A0A] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-black/90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Authenticating…" : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black"
          >
            <HiArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Linktree</span>
          </Link>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-[#0A0A0A]">
          {isEditing ? "Edit Link" : "Add New Link"}
        </h2>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Title / Label
          </label>
          <input
            type="text"
            required
            placeholder="e.g. AWS Cloud Practitioners Workshop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] outline-none focus:border-accent-purple"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Destination URL
          </label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] outline-none focus:border-accent-purple"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Platform / Brand Icon
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] outline-none focus:border-accent-purple"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Description Subtext (Optional)
          </label>
          <input
            type="text"
            placeholder="Short 1-line note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm text-[#0A0A0A] outline-none focus:border-accent-purple"
          />
        </div>

        <label className="flex items-center gap-2.5 pt-1 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded accent-accent-purple"
          />
          <span>Show on public Linktree</span>
        </label>

        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-[#0A0A0A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-black/90 active:scale-95"
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
          <p className="text-xs text-zinc-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-5 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.08] pb-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-black/10 bg-white p-1 shadow-sm">
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
                <h1 className="text-xl font-bold text-[#0A0A0A]">
                  AWS SBG Linktree
                </h1>
                <span className="rounded-full bg-accent-purple/15 px-2.5 py-0.5 text-[10px] font-bold text-accent-purple">
                  CMS
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {links.length} total links •{" "}
                {links.filter((l) => l.is_active).length} active on landing page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs transition-all hover:bg-zinc-100"
            >
              Preview Live ↗
            </Link>
            <button
              onClick={() => {
                setEditing(null);
                setShowEditor(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A0A0A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-black/90 active:scale-95"
            >
              <HiPlus className="h-3.5 w-3.5" />
              <span>Add Link</span>
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-zinc-500 hover:text-black"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Link List */}
        <div className="space-y-2.5">
          {links.map((link, index) => {
            const Icon = getIconForPlatform(link.platform);
            return (
              <div
                key={link.id}
                className={`group flex items-center gap-3.5 rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xs transition-all hover:border-black/20 ${
                  !link.is_active ? "opacity-45" : ""
                }`}
              >
                {/* Platform Icon Badge */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-[#0A0A0A]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[#0A0A0A]">
                      {link.title}
                    </p>
                    {!link.is_active && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] text-zinc-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-400">{link.url}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#0A0A0A] disabled:opacity-20"
                    aria-label="Move up"
                    title="Move up"
                  >
                    <HiOutlineArrowUp className="h-4 w-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === links.length - 1}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#0A0A0A] disabled:opacity-20"
                    aria-label="Move down"
                    title="Move down"
                  >
                    <HiOutlineArrowDown className="h-4 w-4" />
                  </button>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                      link.is_active
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                    }`}
                    title={link.is_active ? "Click to hide" : "Click to show"}
                  >
                    {link.is_active ? "Active" : "Hidden"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditing(link);
                      setShowEditor(true);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#0A0A0A]"
                    aria-label="Edit link"
                    title="Edit"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(link.id, link.title)}
                    className="rounded-lg p-1.5 text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete link"
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
          <div className="rounded-2xl border border-dashed border-black/15 bg-white py-16 text-center">
            <p className="text-sm text-zinc-500">
              No links yet. Click &quot;Add Link&quot; above to create your first button.
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

// ── Page Root ──
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  return <Dashboard />;
}
