import Link from "next/link";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Explore pressure in your own words",
  "Self-guided reading of copy, pressure signals and evidence. No paid audit offer or checkout.",
  "/audit",
);

export default function AuditPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-900">
      <p className="text-sm text-neutral-500">Copy Pressure Audit</p>
      <h1 className="mt-4 text-4xl font-semibold">Explore pressure in your own words.</h1>
      <p className="mt-6 leading-relaxed">The paid audit offer is retired. This page takes no service request or payment and makes no delivery commitment.</p>
      <p className="mt-4 leading-relaxed">You can use the public checker to read a passage, inspect the signals and evidence, and decide what the words mean to you. There is no score to achieve or conversion target to meet.</p>
      <div className="mt-8 flex flex-wrap gap-6">
        <Link href="/check" className="underline">Open the checker</Link>
        <Link href="/methodology" className="underline">Read the methodology</Link>
        <Link href="/sources" className="underline">Explore the sources</Link>
      </div>
      <p className="mt-10 text-sm text-neutral-600">Findings support inquiry; they are not legal advice, certification, or a verdict about a person. Existing paid-review questions can still be sent to contact@cambridgetcg.com.</p>
    </main>
  );
}
