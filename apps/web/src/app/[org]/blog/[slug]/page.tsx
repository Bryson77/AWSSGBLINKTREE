import OrgBlogPostClient from "./OrgBlogPostClient";

export function generateStaticParams() {
  return [{ org: "tut", slug: "welcome" }];
}

export default function OrgBlogPostPage() {
  return <OrgBlogPostClient />;
}
