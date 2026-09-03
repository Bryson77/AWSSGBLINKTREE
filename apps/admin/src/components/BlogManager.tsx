"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, Post, logActivity } from "@awssbg/shared";
import { marked } from "marked";
import { sanitizeContent } from "@awssbg/shared";
import { toast } from "sonner";
import { ImageUploadModal } from "./ImageUploadModal";
import {
  HiPlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlinePhoto,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineCalendar,
} from "react-icons/hi2";

interface BlogManagerProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
}

export function BlogManager({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin,
}: BlogManagerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor modal state
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [showImageModal, setShowImageModal] = useState(false);
  const [renderedPreview, setRenderedPreview] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("posts").select("*");
      if (currentOrgId && currentOrgId !== "all") {
        query = query.eq("org_id", currentOrgId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setPosts(data as Post[]);
    } catch (err) {
      console.error("Failed loading posts:", err);
      toast.error("Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Update markdown preview when content changes
  useEffect(() => {
    if (!editingPost?.content) {
      setRenderedPreview("");
      return;
    }
    Promise.resolve(marked.parse(editingPost.content)).then((html: string) => {
      setRenderedPreview(sanitizeContent(html));
    });
  }, [editingPost?.content]);

  const handleCreateNew = () => {
    setEditingPost({
      org_id: currentOrgId === "all" ? undefined : currentOrgId,
      title: "",
      slug: "",
      content: "",
      cover_image_url: null,
      status: "draft",
    });
    setMobileTab("edit");
    setIsEditorOpen(true);
  };

  const handleEdit = (post: Post) => {
    setEditingPost({ ...post });
    setMobileTab("edit");
    setIsEditorOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const currentSlug = editingPost?.slug || "";
    // Auto-generate slug if slug was previously matching old title or blank
    const autoSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setEditingPost((prev) => ({
      ...prev,
      title,
      slug: !currentSlug || currentSlug === autoSlug.slice(0, currentSlug.length) ? autoSlug : currentSlug,
    }));
  };

  const handleSavePost = async (publish: boolean) => {
    if (!editingPost?.title?.trim() || !editingPost?.content?.trim()) {
      toast.error("Title and article content are required.");
      return;
    }

    const cleanSlug = (editingPost.slug || editingPost.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newStatus = publish ? "published" : "draft";
    const publishedAt = publish
      ? editingPost.published_at || new Date().toISOString()
      : editingPost.published_at;

    try {
      let targetOrgId = editingPost.org_id || currentOrgId;
      if (!targetOrgId || targetOrgId === "all") {
        const { data: defaultOrg } = await supabase
          .from("orgs")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        targetOrgId = defaultOrg?.id;
      }

      if (editingPost.id) {
        // Update
        const { error } = await supabase
          .from("posts")
          .update({
            title: editingPost.title.trim(),
            slug: cleanSlug,
            content: editingPost.content,
            cover_image_url: editingPost.cover_image_url || null,
            status: newStatus,
            published_at: publishedAt,
          })
          .eq("id", editingPost.id);

        if (error) throw error;

        await logActivity(supabase, {
          org_id: targetOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: publish ? "post.published" : "post.updated",
          entity_type: "post",
          entity_id: editingPost.id,
          summary: `${publish ? "Published" : "Updated"} article "${editingPost.title}"`,
        });

        toast.success(`Post ${publish ? "published" : "saved as draft"}!`);
      } else {
        // Insert
        const { data, error } = await supabase
          .from("posts")
          .insert({
            org_id: targetOrgId,
            title: editingPost.title.trim(),
            slug: cleanSlug,
            content: editingPost.content,
            cover_image_url: editingPost.cover_image_url || null,
            status: newStatus,
            published_at: publishedAt,
          })
          .select("id")
          .single();

        if (error) throw error;

        await logActivity(supabase, {
          org_id: targetOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: publish ? "post.published" : "post.created",
          entity_type: "post",
          entity_id: data?.id,
          summary: `${publish ? "Created and published" : "Created draft"} article "${editingPost.title}"`,
        });

        toast.success(`Post ${publish ? "published" : "draft created"}!`);
      }

      setIsEditorOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error("Save post error:", err);
      toast.error("Failed to save post: " + (err as Error).message);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!confirm(`Permanently delete article "${post.title}"?`)) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;

      await logActivity(supabase, {
        org_id: post.org_id,
        actor_id: actorId,
        actor_name: actorName,
        action: "post.deleted",
        entity_type: "post",
        entity_id: post.id,
        summary: `Deleted article "${post.title}"`,
      });

      toast.success("Post deleted.");
      fetchPosts();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete post: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
        <div>
          <div className="mb-1 inline-block border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
            // CMS_MANAGEMENT
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Blog Articles &amp; Recaps
          </h2>
          <p className="font-mono text-xs text-zinc-600">
            Publish technical posts, workshop recaps, and study guides for the public hub.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <HiPlus className="h-4 w-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[3px_3px_0px_#000000]"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
          <HiOutlineDocumentText className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
          <h3 className="font-mono text-xs font-black uppercase text-black">No articles published yet</h3>
          <p className="font-mono text-[11px] text-zinc-500 mt-1">
            Click "New Article" above to create your group's first blog post.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-4 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] transition-shadow"
            >
              <div className="flex items-center gap-3">
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="h-12 w-20 object-cover border border-black shrink-0"
                  />
                ) : (
                  <div className="flex h-12 w-20 items-center justify-center border border-black bg-zinc-100 font-mono text-[10px] text-zinc-400 shrink-0">
                    NO_COVER
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`border border-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase ${
                        post.status === "published"
                          ? "bg-emerald-400 text-black"
                          : "bg-amber-300 text-black"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      /{post.slug}
                    </span>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-black line-clamp-1">
                    {post.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleEdit(post)}
                  className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeletePost(post)}
                  className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-2.5 py-1.5 font-mono text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  title="Delete article"
                >
                  <HiOutlineTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal (Split Desktop / Tabs Mobile) */}
      {isEditorOpen && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs">
          <div className="flex flex-col h-full max-h-[95vh] w-full max-w-5xl border-[3px] border-black bg-white shadow-[10px_10px_0px_#000000]">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="h-5 w-5 text-purple-400" />
                <h3 className="font-mono text-xs font-black uppercase tracking-wider">
                  {editingPost.id ? "Edit Article" : "Compose New Article"}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-white hover:text-purple-400 cursor-pointer"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            {/* Meta Inputs Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b-[3px] border-black bg-zinc-50 p-4">
              <div>
                <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Study Jam: Deep Dive into Lambda"
                  value={editingPost.title || ""}
                  onChange={handleTitleChange}
                  className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-sans text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                  URL Slug (/blog/[slug])
                </label>
                <input
                  type="text"
                  required
                  placeholder="aws-study-jam-lambda"
                  value={editingPost.slug || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                  className="w-full border-2 border-black bg-white px-2.5 py-1.5 font-mono text-xs text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[10px] font-black uppercase text-black">
                  Cover Image
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-mono text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                  >
                    <HiOutlinePhoto className="h-4 w-4 text-purple-600" />
                    <span>{editingPost.cover_image_url ? "Change Photo" : "Upload Photo"}</span>
                  </button>
                  {editingPost.cover_image_url && (
                    <span className="font-mono text-[10px] text-emerald-600 font-bold">
                      &bull; Image Set
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden border-b-2 border-black bg-zinc-200">
              <button
                onClick={() => setMobileTab("edit")}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase ${
                  mobileTab === "edit" ? "bg-white text-black" : "text-zinc-600"
                }`}
              >
                Markdown Editor
              </button>
              <button
                onClick={() => setMobileTab("preview")}
                className={`flex-1 py-2 font-mono text-xs font-black uppercase ${
                  mobileTab === "preview" ? "bg-white text-black" : "text-zinc-600"
                }`}
              >
                Live Preview
              </button>
            </div>

            {/* Split Editor Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Pane: Editor */}
              <div
                className={`flex-1 flex flex-col p-4 border-r-0 md:border-r-[3px] md:border-black ${
                  mobileTab === "edit" ? "flex" : "hidden md:flex"
                }`}
              >
                <div className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold text-zinc-500 uppercase">
                  <span>Markdown Syntax Supported (# H1, **bold**, `code`, etc.)</span>
                  <span>{editingPost.content?.length || 0} chars</span>
                </div>
                <textarea
                  value={editingPost.content || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="Write your article in Markdown..."
                  className="w-full flex-1 resize-none border-2 border-black bg-zinc-50 p-3 font-mono text-xs text-black leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              {/* Right Pane: Live Rendered Preview */}
              <div
                className={`flex-1 flex flex-col p-4 overflow-y-auto bg-white ${
                  mobileTab === "preview" ? "flex" : "hidden md:flex"
                }`}
              >
                <div className="mb-2 font-mono text-[10px] font-bold text-zinc-500 uppercase">
                  Live Formatted Preview
                </div>
                <div className="border-2 border-black bg-zinc-50 p-4 flex-1 overflow-y-auto">
                  {editingPost.cover_image_url && (
                    <img
                      src={editingPost.cover_image_url}
                      alt="Cover"
                      className="mb-4 aspect-[16/9] w-full object-cover border border-black"
                    />
                  )}
                  <h1 className="text-xl font-black uppercase tracking-tight text-black mb-3">
                    {editingPost.title || "Untitled Article"}
                  </h1>
                  <div
                    className="prose prose-sm max-w-none text-zinc-800 font-sans leading-relaxed
                      [&>h1]:text-lg [&>h1]:font-black [&>h1]:uppercase [&>h1]:mt-4 [&>h1]:mb-2
                      [&>h2]:text-base [&>h2]:font-black [&>h2]:uppercase [&>h2]:mt-3 [&>h2]:mb-1
                      [&>p]:text-xs [&>p]:mb-2
                      [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:text-xs [&>ul]:mb-2
                      [&>pre]:bg-black [&>pre]:text-purple-300 [&>pre]:p-2 [&>pre]:font-mono [&>pre]:text-[11px]"
                    dangerouslySetInnerHTML={{ __html: renderedPreview || "<p className='text-zinc-400 italic'>Type on the left to see live preview...</p>" }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between border-t-[3px] border-black bg-zinc-100 px-4 py-3">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-50"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSavePost(false)}
                  className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-100"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSavePost(true)}
                  className="flex items-center gap-1.5 border-2 border-black bg-purple-600 px-5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-purple-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <HiOutlineCheck className="h-4 w-4" />
                  <span>Publish Article</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cover Photo Upload Modal */}
          <ImageUploadModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            onSuccess={(url) => {
              setEditingPost((prev) => (prev ? { ...prev, cover_image_url: url } : null));
              setShowImageModal(false);
            }}
            aspectRatio="16:9"
            category="blog"
            orgId={editingPost?.org_id || currentOrgId}
            title="Upload Article Cover Image"
          />
        </div>
      )}
    </div>
  );
}
