import BlogPostClient from "./BlogPostClient";
import { supabase } from "@awssbg/shared";

export async function generateStaticParams() {
  const slugs = new Set<string>(["welcome"]);

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("slug")
      .eq("status", "published");

    if (posts) {
      for (const post of posts) {
        if (post.slug) {
          slugs.add(post.slug);
        }
      }
    }
  } catch (err) {
    console.error("Error generating static params for /blog/[slug]:", err);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
