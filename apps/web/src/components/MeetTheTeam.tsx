"use client";

import { useEffect, useState } from "react";
import { supabase, TeamMember } from "@awssbg/shared";
import { HiOutlineUser } from "react-icons/hi2";

interface MeetTheTeamProps {
  orgSlug?: string;
}

export default function MeetTheTeam({ orgSlug }: MeetTheTeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        let orgId: string | null = null;
        if (orgSlug) {
          const { data: orgData } = await supabase
            .from("orgs")
            .select("id")
            .eq("slug", orgSlug)
            .maybeSingle();
          orgId = orgData?.id || null;
        } else {
          const { data: defaultOrg } = await supabase
            .from("orgs")
            .select("id")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          orgId = defaultOrg?.id || null;
        }

        if (orgId) {
          const { data } = await supabase
            .from("team_members")
            .select("*")
            .eq("org_id", orgId)
            .order("sort_order", { ascending: true });

          if (data) {
            setMembers(data as TeamMember[]);
          }
        }
      } catch (err) {
        console.error("Failed loading team members:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [orgSlug]);

  if (!loading && members.length === 0) return null;

  // Leader is always first if flagged
  const leader = members.find((m) => m.is_leader);
  const otherMembers = members.filter((m) => m !== leader);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <section className="mt-12 w-full border-t-[3px] border-black pt-10">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
            // LEADERSHIP_&amp;_BUILDERS
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          Meet The Team
        </h2>
        <p className="mt-1 font-mono text-xs font-bold uppercase text-purple-700">
          AWS SBG {orgSlug ? `@${orgSlug.toUpperCase()}` : "Leadership"}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="h-44 w-44 animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group Leader Highlight (Centered alone on first row) */}
          {leader && (
            <div className="flex justify-center">
              <div className="w-full max-w-[280px] border-[3px] border-black bg-white p-5 text-center shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#7C3AED] transition-shadow">
                <div className="mx-auto mb-3 h-28 w-28 overflow-hidden border-[3px] border-black bg-zinc-100 shadow-[3px_3px_0px_#000000]">
                  {leader.photo_url ? (
                    <img
                      src={leader.photo_url}
                      alt={leader.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-purple-600 font-mono text-2xl font-black text-white">
                      {getInitials(leader.name)}
                    </div>
                  )}
                </div>
                <div className="mb-1 inline-block border border-black bg-purple-600 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
                  Group Leader
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-black">
                  {leader.name}
                </h3>
                <p className="font-mono text-xs font-semibold text-zinc-600">
                  {leader.role_title}
                </p>
              </div>
            </div>
          )}

          {/* Members Responsive Grid */}
          {otherMembers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {otherMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center border-[3px] border-black bg-white p-4 text-center shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] transition-shadow"
                >
                  <div className="mb-3 h-20 w-20 overflow-hidden border-2 border-black bg-zinc-100 shadow-[2px_2px_0px_#000000]">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black font-mono text-lg font-black text-white">
                        {getInitials(member.name)}
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-black">
                    {member.name}
                  </h4>
                  <p className="font-mono text-[11px] font-medium text-zinc-600 mt-0.5">
                    {member.role_title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
