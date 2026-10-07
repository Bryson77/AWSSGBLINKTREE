import OrgBlogPostClient from "./OrgBlogPostClient";
import { supabase } from "@awssbg/shared";

export async function generateStaticParams() {
  try {
    const { data: orgs } = await supabase
      .from("orgs")
      .select("id, slug")
      .eq("is_active", true)
      .is("deleted_at", null);

    if (!orgs || orgs.length === 0) {
      return [{ org: "tut", slug: "welcome" }];
    }

    const { data: posts } = await supabase
      .from("posts")
      .select("org_id, slug")
      .eq("status", "published");

    const params: { org: string; slug: string }[] = [];
    for (const org of orgs) {
      const orgPosts = (posts || []).filter((p) => p.org_id === org.id);
      if (orgPosts.length > 0) {
        for (const post of orgPosts) {
          params.push({ org: org.slug.toLowerCase(), slug: post.slug });
        }
      } else {
        params.push({ org: org.slug.toLowerCase(), slug: "welcome" });
      }
    }

    return params.length > 0 ? params : [{ org: "tut", slug: "welcome" }];
  } catch (err) {
    console.error("Error generating static params for [org]/blog/[slug]:", err);
    return [{ org: "tut", slug: "welcome" }];
  }
}

export default function OrgBlogPostPage() {
  return <OrgBlogPostClient />;
}

