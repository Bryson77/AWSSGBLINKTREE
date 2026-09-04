import OrgContactClient from "./OrgContactClient";

export function generateStaticParams() {
  return [{ org: "tut" }];
}

export default function OrgContactPage() {
  return <OrgContactClient />;
}
