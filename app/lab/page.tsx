import { Suspense } from "react";
import { pageMetadata } from "@/lib/site";
import LabClient from "./lab-client";

export const metadata = pageMetadata(
  "Strategy & Experiment Lab",
  "Build an editable, research-informed social, search, email or offer brief. Plan one-variable comparisons, keep evidence honest, and record descriptive results locally.",
  "/lab",
);

export default function LabPage() {
  return <Suspense fallback={<main className="attention-page"><div className="attention-container py-16" role="status">Opening your in-memory workbench…</div></main>}><LabClient /></Suspense>;
}
