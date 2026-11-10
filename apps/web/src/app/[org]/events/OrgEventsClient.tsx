"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitewideBanner from "@/components/SitewideBanner";
import { supabase, Announcement, sanitizeContent } from "@awssbg/shared";
import { marked } from "marked";
import { toast } from "sonner";
import {
  HiArrowLeft,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineShare,
  HiOutlineArrowTopRightOnSquare,
  HiOutlinePhoto,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineTicket,
  HiOutlineUsers,
} from "react-icons/hi2";

export interface EventFeedItem {
  id: string;
  source: "post" | "event";
  title: string;
  slug?: string;
  contentHtml?: string;
  rawContent?: string;
  venue?: string | null;
  dateStr: string;
  displayDate: string;
  images: string[];
  links: Array<{ title: string; url: string }>;
  status?: string;
}

export default function OrgEventsClient({
  initialOrgSlug,
}: {
  initialOrgSlug?: string;
} = {}) {
  const params = useParams();
  const router = useRouter();
  const paramOrgSlug = (params?.org as string) || "";
  const [orgSlug, setOrgSlug] = useState<string>(initialOrgSlug || paramOrgSlug);
  const [shouldRender, setShouldRender] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [feedItems, setFeedItems] = useState<EventFeedItem[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState<string>("");

  // Lightbox Modal state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    title: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: "",
  });

  useEffect(() => {
    let resolvedOrg = initialOrgSlug || paramOrgSlug || "";
    if (typeof window !== "undefined") {
      const segments = window.location.pathname
        .replace(/^\/|\/$/g, "")
        .split("/")
        .filter(Boolean);
      if (
        segments.length >= 2 &&
        (segments[1].toLowerCase() === "events" ||
          segments[1].toLowerCase() === "previous-events")
      ) {
        resolvedOrg = decodeURIComponent(segments[0]);
      }
    }

    if (resolvedOrg && resolvedOrg !== orgSlug) {
      setOrgSlug(resolvedOrg);
    }

    async function loadEventsData() {
      try {
        setShouldRender(true);
        if (!resolvedOrg) return;

        const { data: orgData } = await supabase
          .from("orgs")
          .select("id, name")
          .ilike("slug", resolvedOrg)
          .eq("is_active", true)
          .is("deleted_at", null)
          .maybeSingle();

        if (!orgData?.id) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (orgData) {
          setOrgName(orgData.name);

          // 1. Load active announcement
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

          // 2. Fetch published event recaps & posts for this isolated SBG
          const { data: postsData } = await supabase
            .from("posts")
            .select("*")
            .eq("org_id", orgData.id)
            .eq("status", "published")
            .order("published_at", { ascending: false });

          // 3. Fetch past / concluded events for this isolated SBG
          const { data: eventsData } = await supabase
            .from("events")
            .select("*")
            .eq("org_id", orgData.id)
            .order("start_time", { ascending: false });

          const items: EventFeedItem[] = [];

          // Process Posts (extracting images, metadata, and markdown)
          if (postsData) {
            for (const post of postsData) {
              const imageList: string[] = [];
              if (post.cover_image_url) {
                imageList.push(post.cover_image_url);
              }

              // Extract any inline markdown image urls ![...](url)
              const markdownImgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
              let match;
              while ((match = markdownImgRegex.exec(post.content || "")) !== null) {
                if (match[1] && !imageList.includes(match[1])) {
                  imageList.push(match[1]);
                }
              }

              // Clean text content for feed preview (removing raw image tags)
              const contentWithoutRawImages = (post.content || "").replace(
                /!\[.*?\]\(https?:\/\/[^\s)]+\)/g,
                ""
              );

              const rawHtml = await marked.parse(contentWithoutRawImages);
              const cleanHtml = sanitizeContent(rawHtml);

              const postDate = post.published_at || post.created_at;

              items.push({
                id: `post-${post.id}`,
                source: "post",
                title: post.title,
                slug: post.slug,
                contentHtml: cleanHtml,
                rawContent: post.content,
                venue: "AWS Student Builder Group Hub",
                dateStr: postDate,
                displayDate: new Date(postDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                images: imageList,
                links: [
                  {
                    title: "Read Article View",
                    url: `/${resolvedOrg}/blog/${post.slug}`,
                  },
                ],
                status: "Published Recap",
              });
            }
          }

          // Process Concluded / Scheduled Events
          if (eventsData) {
            for (const ev of eventsData) {
              const eventImages: string[] = [];
              if (ev.poster_url) eventImages.push(ev.poster_url);
              if (ev.banner_url && !eventImages.includes(ev.banner_url)) {
                eventImages.push(ev.banner_url);
              }

              const eventLinks: Array<{ title: string; url: string }> = [];
              if (ev.slug) {
                if (ev.slug.startsWith("http")) {
                  eventLinks.push({ title: "Event Link / Meetup", url: ev.slug });
                } else {
                  eventLinks.push({
                    title: "Registration & Passes",
                    url: `/events/${ev.slug}`,
                  });
                }
              }

              const eventHtml = ev.subtitle
                ? `<p>${ev.subtitle}</p>`
                : "<p>Hands-on builder session, cloud architecture review, and certification prep cohort.</p>";

              items.push({
                id: `event-${ev.id}`,
                source: "event",
                title: ev.title,
                slug: ev.slug,
                contentHtml: sanitizeContent(eventHtml),
                rawContent: ev.subtitle || "",
                venue: ev.venue_name || "Campus Community Lab",
                dateStr: ev.start_time,
                displayDate: new Date(ev.start_time).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                images: eventImages,
                links: eventLinks,
                status: ev.status === "registration_closed" || new Date(ev.end_time || ev.start_time) < new Date()
                  ? "Concluded Session"
                  : "Active Session",
              });
            }
          }

          // Sort chronologically descending
          items.sort(
            (a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()
          );

          setFeedItems(items);
        }
      } catch (err) {
        console.error("Failed loading event feed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEventsData();
  }, [initialOrgSlug, paramOrgSlug, router]);

  const handleShare = async (item: EventFeedItem) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.title} — AWS SBG @${orgSlug.toUpperCase()}`,
          text: `Check out "${item.title}" on AWS SBG @${orgSlug.toUpperCase()}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Event link copied to clipboard!");
    }
  };

  const openLightbox = (images: string[], index: number, title: string) => {
    setLightbox({
      isOpen: true,
      images,
      currentIndex: index,
      title,
    });
  };

  const nextLightboxImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }));
  };

  const prevLightboxImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex:
        (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
    }));
  };

  // Keyboard navigation for photo lightbox
  useEffect(() => {
    if (!lightbox.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightbox((prev) => ({ ...prev, isOpen: false }));
      } else if (e.key === "ArrowRight") {
        nextLightboxImage();
      } else if (e.key === "ArrowLeft") {
        prevLightboxImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox.isOpen]);

  if (!shouldRender) return null;

  if (notFound) {
    return (
      <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md border-[3px] border-black bg-white p-6 sm:p-8 text-center shadow-[6px_6px_0px_#000000]">
            <div className="inline-block border-2 border-black bg-red-500 px-3 py-1 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#000000] mb-4">
              404 // SBG_NOT_FOUND
            </div>
            <h1 className="text-2xl font-black uppercase text-black tracking-tight mb-2">
              SBG Not Found
            </h1>
            <p className="font-mono text-xs text-zinc-600 mb-6 leading-relaxed">
              We couldn&rsquo;t find an active AWS Student Builder Group matching &ldquo;{orgSlug}&rdquo;.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-zinc-800 transition-all no-underline"
            >
              <span>Explore All SBG Groups</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />
      <SitewideBanner announcement={announcement} orgSlug={orgSlug} />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[720px]">
          {/* Top Return Breadcrumb */}
          <div className="mb-6">
            <Link
              href={`/${orgSlug}`}
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all no-underline"
            >
              <HiArrowLeft className="h-3.5 w-3.5" />
              <span>Return to AWS SBG Hub</span>
            </Link>
          </div>

          {/* Section Header */}
          <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                // PREVIOUS_EVENTS // {orgSlug.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Community Events &amp; Study Jam Feed
            </h1>
            <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
              {orgName ? `${orgName} — ` : ""}Recaps, session photos, slides, and past cloud architecture workshops.
            </p>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]"
                />
              ))}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
              <HiOutlinePhoto className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-mono text-sm font-black uppercase text-black">
                No previous events logged yet
              </h3>
              <p className="mt-1 font-mono text-xs text-zinc-600">
                Check back soon! Our student group will publish Study Jam photos and event recaps following upcoming summits.
              </p>
            </div>
          ) : (
            /* Events Feed Timeline */
            <div className="space-y-8">
              {feedItems.map((item) => (
                <article
                  key={item.id}
                  className="border-[3px] border-black bg-white p-5 sm:p-7 shadow-[6px_6px_0px_#000000] transition-all"
                >
                  {/* Card Header & Metadata */}
                  <div className="mb-4 border-b-2 border-black pb-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[1px_1px_0px_#7C3AED]">
                        <span>// {orgSlug.toUpperCase()}</span>
                        <span>&bull;</span>
                        <span className="text-purple-300">{item.status || "EVENT RECAP"}</span>
                      </div>

                      <button
                        onClick={() => handleShare(item)}
                        className="inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-black shadow-[1px_1px_0px_#000000] hover:bg-black hover:text-white transition-all cursor-pointer"
                        title="Share event recap"
                      >
                        <HiOutlineShare className="h-3 w-3 text-purple-600" />
                        <span>Share</span>
                      </button>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                      {item.title}
                    </h2>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3 font-mono text-xs font-bold text-zinc-700">
                      <span className="inline-flex items-center gap-1.5">
                        <HiOutlineCalendar className="h-4 w-4 text-purple-600" />
                        <span>{item.displayDate}</span>
                      </span>
                      {item.venue && (
                        <>
                          <span>&bull;</span>
                          <span className="inline-flex items-center gap-1.5">
                            <HiOutlineMapPin className="h-4 w-4 text-blue-600" />
                            <span>{item.venue}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Narrative Body */}
                  {item.contentHtml && (
                    <div
                      className="prose prose-sm max-w-none text-zinc-800 font-sans leading-relaxed mb-5
                        [&>p]:text-[14px] [&>p]:leading-relaxed [&>p]:mb-3
                        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3
                        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3
                        [&_a]:text-purple-600 [&_a]:underline [&_a]:font-bold [&_a]:hover:text-black"
                      dangerouslySetInnerHTML={{ __html: item.contentHtml }}
                    />
                  )}

                  {/* Multi-Image Feed Gallery */}
                  {item.images.length > 0 && (
                    <div className="mb-5">
                      {item.images.length === 1 && (
                        <div
                          onClick={() => openLightbox(item.images, 0, item.title)}
                          className="aspect-[16/9] w-full overflow-hidden border-[3px] border-black bg-zinc-100 shadow-[4px_4px_0px_#000000] cursor-pointer group"
                        >
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                          />
                        </div>
                      )}

                      {item.images.length === 2 && (
                        <div className="grid grid-cols-2 gap-2.5">
                          {item.images.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => openLightbox(item.images, idx, item.title)}
                              className="aspect-[4/3] overflow-hidden border-2 border-black bg-zinc-100 shadow-[3px_3px_0px_#000000] cursor-pointer group"
                            >
                              <img
                                src={imgUrl}
                                alt={`Photo ${idx + 1}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {item.images.length === 3 && (
                        <div className="grid grid-cols-3 gap-2">
                          <div
                            onClick={() => openLightbox(item.images, 0, item.title)}
                            className="col-span-2 aspect-[16/10] overflow-hidden border-2 border-black bg-zinc-100 shadow-[3px_3px_0px_#000000] cursor-pointer group"
                          >
                            <img
                              src={item.images[0]}
                              alt="Primary event photo"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                            />
                          </div>
                          <div className="col-span-1 flex flex-col gap-2">
                            {item.images.slice(1, 3).map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() =>
                                  openLightbox(item.images, idx + 1, item.title)
                                }
                                className="h-full aspect-[4/3] overflow-hidden border-2 border-black bg-zinc-100 shadow-[2px_2px_0px_#000000] cursor-pointer group"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Photo ${idx + 2}`}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.images.length >= 4 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {item.images.slice(0, 4).map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => openLightbox(item.images, idx, item.title)}
                              className="relative aspect-square overflow-hidden border-2 border-black bg-zinc-100 shadow-[3px_3px_0px_#000000] cursor-pointer group"
                            >
                              <img
                                src={imgUrl}
                                alt={`Event photo ${idx + 1}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                              />
                              {idx === 3 && item.images.length > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-white font-mono text-sm font-black uppercase">
                                  +{item.images.length - 4} More
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resource Action Links */}
                  {item.links.length > 0 && (
                    <div className="border-t-2 border-black pt-4 flex flex-wrap items-center gap-2">
                      {item.links.map((lnk, lIdx) => (
                        <a
                          key={lIdx}
                          href={lnk.url}
                          target={lnk.url.startsWith("http") ? "_blank" : undefined}
                          rel={lnk.url.startsWith("http") ? "noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all no-underline"
                        >
                          <span>{lnk.title}</span>
                          <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal (Neo-Brutalist Image Viewer) */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs">
          <div className="relative flex flex-col max-h-[95vh] max-w-4xl w-full border-[3px] border-white bg-black p-4 shadow-[8px_8px_0px_#7C3AED]">
            {/* Top Lightbox Controls */}
            <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-3 text-white">
              <div className="font-mono text-xs font-black uppercase tracking-wider text-purple-300">
                Photo {lightbox.currentIndex + 1} of {lightbox.images.length} &bull;{" "}
                <span className="text-white">{lightbox.title}</span>
              </div>
              <button
                onClick={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
                className="flex h-8 w-8 items-center justify-center border-2 border-white bg-black hover:bg-white hover:text-black transition-colors cursor-pointer"
                title="Close lightbox (Esc)"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            {/* Main Full-Size Image Frame */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[300px] max-h-[70vh] bg-zinc-950 border-2 border-zinc-800">
              <img
                src={lightbox.images[lightbox.currentIndex]}
                alt="Enlarged event photo"
                className="max-h-full max-w-full object-contain"
              />

              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={prevLightboxImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border-2 border-white bg-black/80 text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
                    title="Previous photo (Left Arrow)"
                  >
                    <HiOutlineChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextLightboxImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border-2 border-white bg-black/80 text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_#000000]"
                    title="Next photo (Right Arrow)"
                  >
                    <HiOutlineChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {lightbox.images.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto py-1">
                {lightbox.images.map((imgUrl, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() =>
                      setLightbox((prev) => ({ ...prev, currentIndex: tIdx }))
                    }
                    className={`h-12 w-16 shrink-0 overflow-hidden border-2 cursor-pointer transition-all ${
                      lightbox.currentIndex === tIdx
                        ? "border-accent-purple shadow-[2px_2px_0px_#7C3AED]"
                        : "border-zinc-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${tIdx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
