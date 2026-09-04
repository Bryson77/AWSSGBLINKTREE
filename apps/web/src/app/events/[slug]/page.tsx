import EventRegistrationClient from "./EventRegistrationClient";

export function generateStaticParams() {
  return [
    { slug: "aws-student-community-day-2026" },
    { slug: "community-day-2026" },
  ];
}

export default function EventRegistrationPage() {
  return <EventRegistrationClient />;
}
