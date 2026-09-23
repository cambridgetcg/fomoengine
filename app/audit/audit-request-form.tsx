export function AuditRequestForm({ contactEmail }: { contactEmail: string | null }) {
  return <p>New paid audit requests are retired.{contactEmail ? ` Existing-request support: ${contactEmail}.` : ""}</p>;
}
