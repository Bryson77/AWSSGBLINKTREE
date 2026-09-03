import OrgAboutClient from "./OrgAboutClient";

export function generateStaticParams() {
  return [{ org: "tut" }];
}

export default function OrgAboutPage() {
  return <OrgAboutClient />;
}
