import OrgHomeClient from "./OrgHomeClient";

export function generateStaticParams() {
  return [{ org: "tut" }];
}

export default function OrgHomePage() {
  return <OrgHomeClient />;
}
