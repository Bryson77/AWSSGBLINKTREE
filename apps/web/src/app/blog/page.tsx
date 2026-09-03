"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitewideBanner from "@/components/SitewideBanner";
import { supabase, Post, Announcement } from "@awssbg/shared";
import {
  HiArrowLeft,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiArrowUpRight,
} from "react-icons/hi2";

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: orgData } = await supabase
          .from("orgs")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (orgData?.id) {
          const nowIso = new Date().toISOString();
          const { data: annData } = await supabase
            .from("announcements")
            .select("*")
            .eq("org_id", orgData.id)
            .eq("is_active", true)
            .lte("start_date", nowIso)
            .order("start_date", { ascending: false });

          if (annData && annData.length > 0) {
            const activeItem = annData.find(
              (a) => !a.end_date || new Date(a.end_date) >= new Date()
            );
            setAnnouncement(activeItem ? (activeItem as Announcement) : null);
          } else {
            setAnnouncement(null);
          }
        }

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (data && !error) {
          setPosts(data as Post[]);
        }
      } catch (err) {
        console.error("Failed loading blog data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const calculateReadingTime = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "RECENT";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).toUpperCase();
  };

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      <SitewideBanner announcement={announcement} />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[720px]">
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all"
            >
              <HiArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Home</span>
            </Link>
          </div>

          {/* Header Card */}
          <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                // AWS_SBG // CLOUD_INSIGHTS_&amp;_BLOG
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Student Cloud Articles &amp; Recaps
            </h1>
            <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
              Technical guides, Study Jam recaps, and cloud certification strategies written by student builders.
            </p>
          </div>

          {/* Articles Feed */}
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
              <HiOutlineDocumentText className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-mono text-sm font-black uppercase text-black">No articles published yet</h3>
              <p className="mt-1 font-mono text-xs text-zinc-600">
                Check back soon! Our student leaders are preparing technical write-ups and Study Jam recaps.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block border-[3px] border-black bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#7C3AED] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all no-underline text-black"
                >
                  {post.cover_image_url && (
                    <div className="mb-4 aspect-[16/9] w-full overflow-hidden border-2 border-black bg-zinc-100">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                    </div>
                  )}

                  {/* Metadata Bar */}
                  <div className="mb-2 flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold text-zinc-600">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineCalendar className="h-3.5 w-3.5 text-purple-600" />
                      {formatDate(post.published_at)}
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineClock className="h-3.5 w-3.5 text-blue-600" />
                      {calculateReadingTime(post.content)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black group-hover:text-purple-700 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="mt-2 text-sm text-zinc-700 line-clamp-2 leading-relaxed">
                    {post.content.replace(/[#*`_\[\]]/g, "").slice(0, 160)}...
                  </p>

                  {/* Read More Link */}
                  <div className="mt-4 inline-flex items-center gap-1 font-mono text-xs font-black uppercase text-black group-hover:text-purple-700">
                    <span>Read Full Article</span>
                    <HiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
