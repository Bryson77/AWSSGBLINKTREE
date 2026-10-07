"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, TeamMember, Organization } from "@awssbg/shared";
import { FaLinkedinIn, FaGithub } from "react-icons/fa6";
import { HiOutlineBuildingLibrary, HiArrowUpRight } from "react-icons/hi2";

interface MeetTheTeamProps {
  orgSlug?: string;
}

interface CampusLeaderWithOrg {
  member: TeamMember;
  org: Organization;
}

export default function MeetTheTeam({ orgSlug }: MeetTheTeamProps) {
  // Campus-specific team state
  const [members, setMembers] = useState<TeamMember[]>([]);
  // Global leadership state across active campuses
  const [globalLeaders, setGlobalLeaders] = useState<CampusLeaderWithOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true);

        if (orgSlug) {
          // ── Case A: Campus-specific team roster ──
          const { data: orgData } = await supabase
            .from("orgs")
            .select("id")
            .ilike("slug", orgSlug)
            .eq("is_active", true)
            .is("deleted_at", null)
            .maybeSingle();

          if (orgData?.id) {
            const { data } = await supabase
              .from("team_members")
              .select("*")
              .eq("org_id", orgData.id)
              .order("sort_order", { ascending: true });

            if (data) {
              setMembers(data as TeamMember[]);
            }
          }
        } else {
          // ── Case B: Global About page — dynamic active campus leaders ──
          const { data: activeOrgs } = await supabase
            .from("orgs")
            .select("*")
            .eq("is_active", true)
            .is("deleted_at", null)
            .order("name", { ascending: true });

          if (activeOrgs && activeOrgs.length > 0) {
            const orgIds = activeOrgs.map((o) => o.id);
            const { data: leadersData } = await supabase
              .from("team_members")
              .select("*")
              .in("org_id", orgIds)
              .eq("is_leader", true)
              .order("sort_order", { ascending: true });

            if (leadersData) {
              const leadersList: CampusLeaderWithOrg[] = [];
              for (const leader of leadersData as TeamMember[]) {
                const matchedOrg = activeOrgs.find((o) => o.id === leader.org_id);
                if (matchedOrg) {
                  leadersList.push({ member: leader, org: matchedOrg as Organization });
                }
              }
              setGlobalLeaders(leadersList);
            }
          }
        }
      } catch (err) {
        console.error("Failed loading team members:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [orgSlug]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // ── Render Case A: Campus-Specific Team Roster (/{slug}/about) ──
  if (orgSlug) {
    if (!loading && members.length === 0) return null;

    const leader = members.find((m) => m.is_leader);
    const otherMembers = members.filter((m) => m !== leader);

    return (
      <section className="mt-12 w-full border-t-[3px] border-black pt-10">
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
            AWS SBG @{orgSlug.toUpperCase()}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-56 animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Group Leader Highlight (Centered alone on top) */}
            {leader && (
              <div className="flex justify-center">
                <div className="w-full max-w-[300px] border-[3px] border-black bg-white p-5 text-center shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#7C3AED] transition-shadow">
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

                  {/* Social Profile Badges */}
                  {(leader.linkedin_url || leader.github_url) && (
                    <div className="mt-3 flex items-center justify-center gap-2 pt-2 border-t border-black/10">
                      {leader.linkedin_url && (
                        <a
                          href={leader.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center border border-black bg-zinc-100 text-black shadow-[1px_1px_0px_#000000] hover:bg-[#0A66C2] hover:text-white transition-colors"
                          title="LinkedIn Profile"
                          aria-label={`${leader.name}'s LinkedIn Profile`}
                        >
                          <FaLinkedinIn className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {leader.github_url && (
                        <a
                          href={leader.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center border border-black bg-zinc-100 text-black shadow-[1px_1px_0px_#000000] hover:bg-black hover:text-white transition-colors"
                          title="GitHub Profile"
                          aria-label={`${leader.name}'s GitHub Profile`}
                        >
                          <FaGithub className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members Responsive Grid */}
            {otherMembers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {otherMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center justify-between border-[3px] border-black bg-white p-4 text-center shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] transition-shadow"
                  >
                    <div className="flex flex-col items-center w-full">
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

                    {/* Social Profile Badges */}
                    {(member.linkedin_url || member.github_url) && (
                      <div className="mt-3 flex items-center justify-center gap-2 pt-2 border-t border-black/10 w-full">
                        {member.linkedin_url && (
                          <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center border border-black bg-zinc-100 text-black shadow-[1px_1px_0px_#000000] hover:bg-[#0A66C2] hover:text-white transition-colors"
                            title="LinkedIn Profile"
                            aria-label={`${member.name}'s LinkedIn Profile`}
                          >
                            <FaLinkedinIn className="h-3 w-3" />
                          </a>
                        )}
                        {member.github_url && (
                          <a
                            href={member.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-6 w-6 items-center justify-center border border-black bg-zinc-100 text-black shadow-[1px_1px_0px_#000000] hover:bg-black hover:text-white transition-colors"
                            title="GitHub Profile"
                            aria-label={`${member.name}'s GitHub Profile`}
                          >
                            <FaGithub className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── Render Case B: Global Root About Page (/about) ──
  return (
    <section className="mt-12 w-full border-t-[3px] border-black pt-10">
      <div className="text-center mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
            // CAMPUS_LEADERS
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          AWS SBG Leadership
        </h2>
        <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
          Student leaders powering AWS Student Builder Groups across university campuses.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]" />
          ))}
        </div>
      ) : globalLeaders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {globalLeaders.map(({ member, org }) => (
            <div
              key={member.id}
              className="flex flex-col justify-between border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#7C3AED] transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1 border border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[1px_1px_0px_#7C3AED]">
                    <HiOutlineBuildingLibrary className="h-3 w-3 text-purple-300" />
                    <span>AWS SBG</span>
                  </div>
                  <span className="border border-black bg-zinc-100 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-purple-700">
                    @{org.slug.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden border-2 border-black bg-zinc-100 shadow-[2px_2px_0px_#000000] shrink-0">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-purple-600 font-mono text-lg font-black text-white">
                        {getInitials(member.name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black uppercase tracking-tight text-black truncate group-hover:text-purple-700 transition-colors">
                      {member.name}
                    </h3>
                    <p className="font-mono text-xs font-semibold text-zinc-600">
                      {member.role_title}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-500 truncate mt-0.5">
                      {org.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action: Link to Campus About Page */}
              <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-6 items-center justify-center border border-black bg-zinc-100 text-black hover:bg-[#0A66C2] hover:text-white transition-colors"
                      title="LinkedIn"
                    >
                      <FaLinkedinIn className="h-3 w-3" />
                    </a>
                  )}
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-6 items-center justify-center border border-black bg-zinc-100 text-black hover:bg-black hover:text-white transition-colors"
                      title="GitHub"
                    >
                      <FaGithub className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <Link
                  href={`/${org.slug}/about`}
                  className="inline-flex items-center gap-1 font-mono text-xs font-black uppercase text-black hover:text-purple-700 no-underline"
                >
                  <span>View Campus &rarr;</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Tasteful, compact Platform Architecture & Maintenance Credit Line (No photo, not huge) */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-2 border-2 border-black bg-zinc-100 px-3.5 py-1.5 shadow-[2px_2px_0px_#000000]">
          <span className="font-mono text-[10px] font-black uppercase text-zinc-500">
            // MAINTAINER
          </span>
          <span className="font-mono text-xs font-bold text-black">
            Platform architected &amp; maintained by{" "}
            <strong className="font-black text-purple-700">Bryson Mabilo</strong>
          </span>
        </div>
      </div>
    </section>
  );
}
