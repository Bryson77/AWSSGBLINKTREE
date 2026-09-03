import OrgBlogClient from "./OrgBlogClient";

export function generateStaticParams() {
  return [{ org: "tut" }];
}

export default function OrgBlogPage() {
  return <OrgBlogClient />;
}
