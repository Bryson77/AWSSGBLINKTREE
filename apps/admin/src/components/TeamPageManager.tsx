"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, TeamMember, logActivity } from "@awssbg/shared";
import { toast } from "sonner";
import { ImageUploadModal } from "./ImageUploadModal";
import {
  HiPlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlinePhoto,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineUserGroup,
} from "react-icons/hi2";

interface TeamPageManagerProps {
  currentOrgId: string;
  actorId: string;
  actorName: string;
  isSuperAdmin: boolean;
}

export function TeamPageManager({
  currentOrgId,
  actorId,
  actorName,
  isSuperAdmin,
}: TeamPageManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add modal state
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("team_members").select("*");
      if (currentOrgId && currentOrgId !== "all") {
        query = query.eq("org_id", currentOrgId);
      }
      const { data, error } = await query.order("sort_order", { ascending: true });
      if (error) throw error;
      if (data) setMembers(data as TeamMember[]);
    } catch (err) {
      console.error("Failed loading team members:", err);
      toast.error("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateNew = () => {
    setEditingMember({
      org_id: currentOrgId === "all" ? undefined : currentOrgId,
      name: "",
      role_title: "",
      photo_url: null,
      is_leader: false,
      sort_order: members.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (m: TeamMember) => {
    setEditingMember({ ...m });
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.name?.trim() || !editingMember?.role_title?.trim()) {
      toast.error("Name and Role Title are required.");
      return;
    }

    try {
      let targetOrgId = editingMember.org_id || currentOrgId;
      if (!targetOrgId || targetOrgId === "all") {
        const { data: defaultOrg } = await supabase
          .from("orgs")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        targetOrgId = defaultOrg?.id;
      }

      if (editingMember.id) {
        // Update
        const { error } = await supabase
          .from("team_members")
          .update({
            name: editingMember.name.trim(),
            role_title: editingMember.role_title.trim(),
            photo_url: editingMember.photo_url || null,
            is_leader: !!editingMember.is_leader,
          })
          .eq("id", editingMember.id);

        if (error) throw error;

        await logActivity(supabase, {
          org_id: targetOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: "team_member.updated",
          entity_type: "team_member",
          entity_id: editingMember.id,
          summary: `Updated team member "${editingMember.name}" (${editingMember.role_title})`,
        });

        toast.success("Team member updated!");
      } else {
        // Insert
        const maxSort = members.length > 0 ? Math.max(...members.map((m) => m.sort_order)) : 0;
        const { data, error } = await supabase
          .from("team_members")
          .insert({
            org_id: targetOrgId,
            name: editingMember.name.trim(),
            role_title: editingMember.role_title.trim(),
            photo_url: editingMember.photo_url || null,
            is_leader: !!editingMember.is_leader,
            sort_order: maxSort + 1,
          })
          .select("id")
          .single();

        if (error) throw error;

        await logActivity(supabase, {
          org_id: targetOrgId,
          actor_id: actorId,
          actor_name: actorName,
          action: "team_member.added",
          entity_type: "team_member",
          entity_id: data?.id,
          summary: `Added team member "${editingMember.name}" as ${editingMember.role_title}`,
        });

        toast.success("Team member added!");
      }

      setIsModalOpen(false);
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      console.error("Save team member error:", err);
      toast.error("Failed to save team member: " + (err as Error).message);
    }
  };

  const handleDelete = async (m: TeamMember) => {
    if (!confirm(`Remove "${m.name}" from the group team?`)) return;

    try {
      const { error } = await supabase.from("team_members").delete().eq("id", m.id);
      if (error) throw error;

      await logActivity(supabase, {
        org_id: m.org_id,
        actor_id: actorId,
        actor_name: actorName,
        action: "team_member.deleted",
        entity_type: "team_member",
        entity_id: m.id,
        summary: `Removed team member "${m.name}"`,
      });

      toast.success("Team member removed.");
      fetchMembers();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete team member: " + (err as Error).message);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const current = members[index];
    const swap = members[targetIndex];

    const currentOrder = current.sort_order;
    const swapOrder = swap.sort_order;

    try {
      await supabase.from("team_members").update({ sort_order: swapOrder }).eq("id", current.id);
      await supabase.from("team_members").update({ sort_order: currentOrder }).eq("id", swap.id);

      fetchMembers();
    } catch (err) {
      console.error("Reorder error:", err);
      toast.error("Failed to reorder team members.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000]">
        <div>
          <div className="mb-1 inline-block border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED]">
            // TEAM_MANAGEMENT
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Meet The Team Roster
          </h2>
          <p className="font-mono text-xs text-zinc-600">
            Manage student leaders and builders displayed on the public About page.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <HiPlus className="h-4 w-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[3px_3px_0px_#000000]"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
          <HiOutlineUserGroup className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
          <h3 className="font-mono text-xs font-black uppercase text-black">No team members added yet</h3>
          <p className="font-mono text-[11px] text-zinc-500 mt-1">
            Click "Add Member" above to add leaders and builders to this group.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m, index) => (
            <div
              key={m.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[3px] border-black bg-white p-4 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden border-2 border-black bg-zinc-100 shrink-0">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black font-mono text-xs font-black text-white">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {m.is_leader && (
                      <span className="border border-black bg-purple-600 px-1.5 py-0.2 font-mono text-[9px] font-black uppercase text-white">
                        Group Leader
                      </span>
                    )}
                    <h4 className="text-sm font-black uppercase tracking-tight text-black">
                      {m.name}
                    </h4>
                  </div>
                  <p className="font-mono text-xs font-medium text-zinc-600">
                    {m.role_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Reorder buttons */}
                <button
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                  className="border-2 border-black bg-white p-1.5 text-black hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <HiOutlineArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleMove(index, "down")}
                  disabled={index === members.length - 1}
                  className="border-2 border-black bg-white p-1.5 text-black hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <HiOutlineArrowDown className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => handleEdit(m)}
                  className="flex items-center gap-1 border-2 border-black bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="border-2 border-black bg-zinc-100 p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                  title="Remove Member"
                >
                  <HiOutlineTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveMember}
            className="w-full max-w-md border-[3px] border-black bg-white shadow-[8px_8px_0px_#000000]"
          >
            <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-4 py-3 text-white">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider">
                {editingMember.id ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-purple-400 cursor-pointer"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Photo Preview & Upload */}
              <div className="flex items-center gap-4 border-2 border-black bg-zinc-50 p-3">
                <div className="h-16 w-16 overflow-hidden border-2 border-black bg-white shrink-0">
                  {editingMember.photo_url ? (
                    <img
                      src={editingMember.photo_url}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-200 font-mono text-[10px] text-zinc-500">
                      NO PHOTO
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 cursor-pointer"
                  >
                    <HiOutlinePhoto className="h-4 w-4 text-purple-600" />
                    <span>{editingMember.photo_url ? "Change Photo" : "Upload Photo"}</span>
                  </button>
                  <p className="font-mono text-[9px] text-zinc-500 mt-1">
                    Square 1:1 ratio. Max 20MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Naledi Khumalo"
                  value={editingMember.name || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-sans text-sm text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-black uppercase text-black">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Lead &amp; Study Jam Coordinator"
                  value={editingMember.role_title || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, role_title: e.target.value })}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 border-2 border-black bg-zinc-50 p-3">
                <input
                  type="checkbox"
                  id="is_leader"
                  checked={!!editingMember.is_leader}
                  onChange={(e) => setEditingMember({ ...editingMember, is_leader: e.target.checked })}
                  className="h-4 w-4 accent-purple-600 cursor-pointer"
                />
                <label htmlFor="is_leader" className="font-mono text-xs font-black uppercase text-black cursor-pointer">
                  Flag as Primary Group Leader (Featured at top)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between border-t-[3px] border-black bg-zinc-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 border-2 border-black bg-purple-600 px-5 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] hover:bg-purple-700"
              >
                <HiOutlineCheck className="h-4 w-4" />
                <span>Save Member</span>
              </button>
            </div>
          </form>

          {/* Photo Upload Modal */}
          <ImageUploadModal
            isOpen={showPhotoModal}
            onClose={() => setShowPhotoModal(false)}
            onSuccess={(url) => {
              setEditingMember((prev) => (prev ? { ...prev, photo_url: url } : null));
              setShowPhotoModal(false);
            }}
            aspectRatio="1:1"
            category="team"
            orgId={editingMember.org_id || currentOrgId}
            title="Upload Team Member Photo"
          />
        </div>
      )}
    </div>
  );
}
