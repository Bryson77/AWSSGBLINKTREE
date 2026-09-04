import TicketPassClient from "./TicketPassClient";

export function generateStaticParams() {
  return [{ token: "preview" }];
}

export default function TicketPassPage() {
  return <TicketPassClient />;
}
