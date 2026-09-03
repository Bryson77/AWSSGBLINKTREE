"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase, Post } from "@awssbg/shared";
import { marked } from "marked";
import { sanitizeContent } from "@awssbg/shared";
import {
  HiArrowLeft,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineShare,
} from "react-icons/hi2";
import { toast } from "sonner";

export default function BlogPostClient() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (!slug) return;

    async function loadPost() {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (error || !data) {
          console.warn("Post not found:", error?.message);
        } else {
          setPost(data as Post);
          const rawHtml = await marked.parse(data.content || "");
          const cleanHtml = sanitizeContent(rawHtml);
          setHtmlContent(cleanHtml);
        }
      } catch (err) {
        console.error("Failed loading post:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slug]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || "AWS SBG Article",
          text: `Read "${post?.title}" on AWS Student Builder Group`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Article link copied to clipboard!");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "RECENT";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateReadingTime = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
        <Header />
        <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-[720px]">
            <div className="h-96 w-full animate-pulse border-[3px] border-black bg-zinc-200 shadow-[6px_6px_0px_#000000]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
        <Header />
        <main className="flex-1 px-4 sm:px-6 py-12">
          <div className="mx-auto max-w-[600px] border-[3px] border-black bg-white p-8 text-center shadow-[6px_6px_0px_#000000]">
            <h1 className="text-xl font-black uppercase text-black">Article Not Found</h1>
            <p className="mt-2 text-sm text-zinc-600 font-mono">
              The article you are looking for may have been moved or unpublished.
            </p>
            <div className="mt-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-zinc-800"
              >
                <HiArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Articles</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="brutal-grid-bg flex min-h-screen flex-col bg-[#F4F4F5]">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <article className="mx-auto max-w-[720px]">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all"
            >
              <HiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Articles</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <HiOutlineShare className="h-3.5 w-3.5 text-purple-600" />
              <span>Share Article</span>
            </button>
          </div>

          <div className="border-[3px] border-black bg-white p-6 sm:p-10 shadow-[8px_8px_0px_#000000]">
            <div className="mb-3 inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-0.5 text-white shadow-[2px_2px_0px_#7C3AED]">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white">
                // AWS_SBG // ARTICLE
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black leading-tight">
              {post.title}
            </h1>

            <div className="mt-4 mb-6 flex flex-wrap items-center gap-3 border-y-2 border-black py-3 font-mono text-xs font-bold text-zinc-700">
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineCalendar className="h-4 w-4 text-purple-600" />
                {formatDate(post.published_at)}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineClock className="h-4 w-4 text-blue-600" />
                {calculateReadingTime(post.content)}
              </span>
            </div>

            {post.cover_image_url && (
              <div className="mb-8 aspect-[16/9] w-full overflow-hidden border-[3px] border-black bg-zinc-100 shadow-[4px_4px_0px_#000000]">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div
              className="prose max-w-none text-zinc-800 leading-relaxed font-sans
                [&>h1]:text-2xl [&>h1]:font-black [&>h1]:uppercase [&>h1]:text-black [&>h1]:mt-8 [&>h1]:mb-3
                [&>h2]:text-xl [&>h2]:font-black [&>h2]:uppercase [&>h2]:text-black [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:border-l-4 [&>h2]:border-purple-600 [&>h2]:pl-2
                [&>h3]:text-lg [&>h3]:font-black [&>h3]:uppercase [&>h3]:text-black [&>h3]:mt-5 [&>h3]:mb-2
                [&>p]:text-[15px] [&>p]:leading-relaxed [&>p]:mb-4
                [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1
                [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol>li]:mb-1
                [&>blockquote]:border-l-4 [&>blockquote]:border-black [&>blockquote]:bg-zinc-50 [&>blockquote]:p-4 [&>blockquote]:font-mono [&>blockquote]:text-sm [&>blockquote]:my-4 [&>blockquote]:italic
                [&>pre]:border-2 [&>pre]:border-black [&>pre]:bg-zinc-950 [&>pre]:text-purple-300 [&>pre]:p-4 [&>pre]:overflow-x-auto [&>pre]:my-4 [&>pre]:font-mono [&>pre]:text-xs
                [&>code]:bg-zinc-100 [&>code]:border [&>code]:border-black [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:font-mono [&>code]:text-xs [&>code]:text-purple-800
                [&>table]:w-full [&>table]:border-collapse [&>table]:border-2 [&>table]:border-black [&>table]:my-4
                [&>table_th]:border-2 [&>table_th]:border-black [&>table_th]:bg-black [&>table_th]:text-white [&>table_th]:p-2 [&>table_th]:font-mono [&>table_th]:text-xs [&>table_th]:uppercase
                [&>table_td]:border-2 [&>table_td]:border-black [&>table_td]:p-2 [&>table_td]:font-mono [&>table_td]:text-xs"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            <div className="mt-10 border-t-2 border-black pt-6 flex items-center justify-between">
              <div className="font-mono text-xs font-black uppercase text-zinc-700">
                // AWS_STUDENT_BUILDER_GROUP &bull; GO BUILD.
              </div>
              <button
                onClick={handleShare}
                className="border-2 border-black bg-black px-3 py-1 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-zinc-800"
              >
                Share
              </button>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
