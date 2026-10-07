import OrgContactClient from "./OrgContactClient";
import { supabase } from "@awssbg/shared";

export async function generateStaticParams() {
  try {
    const { data: orgs } = await supabase
      .from("orgs")
      .select("slug")
      .eq("is_active", true)
      .is("deleted_at", null);

    if (!orgs || orgs.length === 0) return [{ org: "tut" }];
    const paths = new Set<string>();
    for (const o of orgs) {
      if (o.slug) {
        paths.add(o.slug.toLowerCase());
        paths.add(o.slug.toUpperCase());
      }
    }
    return Array.from(paths).map((slug) => ({ org: slug }));
  } catch (err) {
    console.error("Error generating static params for [org]/contact:", err);
    return [{ org: "tut" }];
  }
}

export default function OrgContactPage() {
  return <OrgContactClient />;
}

