"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase, Organization, sanitizeContent } from "@awssbg/shared";
import { marked } from "marked";
import { toast } from "sonner";
import {
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineShare,
  HiOutlineArrowTopRightOnSquare,
  HiOutlinePhoto,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineBuildingLibrary,
  HiOutlineTicket,
} from "react-icons/hi2";
import { EventFeedItem } from "../[org]/events/OrgEventsClient";

export default function GlobalEventsPage() {
  const [feedItems, setFeedItems] = useState<EventFeedItem[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

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
    async function fetchAllEvents() {
      try {
        setLoading(true);

        // 1. Fetch all active SBGs
        const { data: orgsData } = await supabase
          .from("orgs")
          .select("*")
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        if (orgsData) {
          setOrgs(orgsData as Organization[]);
        }

        // 2. Fetch published posts across all SBGs
        const { data: postsData } = await supabase
          .from("posts")
          .select("*, orgs(name, slug)")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        // 3. Fetch all events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*, orgs(name, slug)")
          .order("start_time", { ascending: false });

        const items: EventFeedItem[] = [];

        if (postsData) {
          for (const post of postsData) {
            const rawOrg = (post as any).orgs;
            const orgInfo = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
            const orgSlug = orgInfo?.slug || "general";

            const imageList: string[] = [];
            if (post.cover_image_url) {
              imageList.push(post.cover_image_url);
            }

            const markdownImgRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
            let match;
            while ((match = markdownImgRegex.exec(post.content || "")) !== null) {
              if (match[1] && !imageList.includes(match[1])) {
                imageList.push(match[1]);
              }
            }

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
              venue: orgInfo?.name || "AWS Student Builder Group",
              dateStr: postDate,
              displayDate: new Date(postDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              images: imageList,
              links: [
                {
                  title: `View on @${orgSlug.toUpperCase()} Hub`,
                  url: `/${orgSlug}/events`,
                },
                {
                  title: "Read Article",
                  url: `/${orgSlug}/blog/${post.slug}`,
                },
              ],
              status: orgInfo?.slug?.toUpperCase() || "COMMUNITY",
            });
          }
        }

        if (eventsData) {
          for (const ev of eventsData) {
            const rawOrg = (ev as any).orgs;
            const orgInfo = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
            const orgSlug = orgInfo?.slug || "general";

            const eventImages: string[] = [];
            if (ev.poster_url) eventImages.push(ev.poster_url);
            if (ev.banner_url && !eventImages.includes(ev.banner_url)) {
              eventImages.push(ev.banner_url);
            }

            const eventLinks: Array<{ title: string; url: string }> = [
              {
                title: `Visit @${orgSlug.toUpperCase()} Events`,
                url: `/${orgSlug}/events`,
              },
            ];

            if (ev.slug) {
              if (ev.slug.startsWith("http")) {
                eventLinks.push({ title: "Meetup Session", url: ev.slug });
              } else {
                eventLinks.push({
                  title: "Event Passes & Registration",
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
              venue: ev.venue_name || orgInfo?.name || "AWS SBG Campus",
              dateStr: ev.start_time,
              displayDate: new Date(ev.start_time).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              images: eventImages,
              links: eventLinks,
              status: orgInfo?.slug?.toUpperCase() || "SESSION",
            });
          }
        }

        items.sort(
          (a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()
        );
        setFeedItems(items);
      } catch (err) {
        console.error("Failed loading global event feed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllEvents();
  }, []);

  const handleShare = async (item: EventFeedItem) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out "${item.title}" on AWS Student Builder Groups`,
          url,
        });
        return;
      } catch {
        // Fallback
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

  // Keyboard navigation for lightbox
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

  const filteredItems = feedItems.filter((item) => {
    if (selectedOrgFilter === "all") return true;
    return item.status?.toLowerCase() === selectedOrgFilter.toLowerCase();
  });

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[720px]">
          {/* Header */}
          <div className="border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                // AWS_SBG // ALL_PREVIOUS_EVENTS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              Community Events &amp; Study Jam Recaps
            </h1>
            <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
              Browse past workshop sessions, multi-photo recaps, slides, and hackathon highlights across all campus groups.
            </p>

            {/* University Group Filter Tabs */}
            {orgs.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t-2 border-black pt-4">
                <span className="font-mono text-[10px] font-black uppercase text-zinc-500 mr-1">
                  Filter SBG:
                </span>
                <button
                  onClick={() => setSelectedOrgFilter("all")}
                  className={`border-2 border-black px-2.5 py-1 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all cursor-pointer ${
                    selectedOrgFilter === "all"
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-zinc-100"
                  }`}
                >
                  All Groups
                </button>
                {orgs.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrgFilter(o.slug)}
                    className={`border-2 border-black px-2.5 py-1 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all cursor-pointer ${
                      selectedOrgFilter.toLowerCase() === o.slug.toLowerCase()
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-zinc-100"
                    }`}
                  >
                    @{o.slug.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[4px_4px_0px_#000000]"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="border-[3px] border-black bg-white p-10 text-center shadow-[4px_4px_0px_#000000]">
              <HiOutlinePhoto className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-mono text-sm font-black uppercase text-black">
                No events found for this selection
              </h3>
              <p className="mt-1 font-mono text-xs text-zinc-600">
                Try selecting &quot;All Groups&quot; above to view recaps from other universities.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="border-[3px] border-black bg-white p-5 sm:p-7 shadow-[6px_6px_0px_#000000] transition-all"
                >
                  {/* Card Header & Metadata */}
                  <div className="mb-4 border-b-2 border-black pb-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white shadow-[1px_1px_0px_#7C3AED]">
                        <span>// @{item.status}</span>
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

                  {/* Content */}
                  {item.contentHtml && (
                    <div
                      className="prose prose-sm max-w-none text-zinc-800 font-sans leading-relaxed mb-5
                        [&>p]:text-[14px] [&>p]:leading-relaxed [&>p]:mb-3
                        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3
                        [&_a]:text-purple-600 [&_a]:underline [&_a]:font-bold [&_a]:hover:text-black"
                      dangerouslySetInnerHTML={{ __html: item.contentHtml }}
                    />
                  )}

                  {/* Multi-Image Gallery */}
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

                  {/* Resource Links */}
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

      {/* Lightbox Modal */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs">
          <div className="relative flex flex-col max-h-[95vh] max-w-4xl w-full border-[3px] border-white bg-black p-4 shadow-[8px_8px_0px_#7C3AED]">
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

            <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[300px] max-h-[70vh] bg-zinc-950 border-2 border-zinc-800">
              <img
                src={lightbox.images[lightbox.currentIndex]}
                alt="Enlarged photo"
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
