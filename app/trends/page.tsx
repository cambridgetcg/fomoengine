import { pageMetadata } from "@/lib/site";
import TrendsClient from "./trends-client";

export const metadata = pageMetadata(
  "Trend Context Notebook",
  "Record manual trend observations with sources, geography, dates and comparison context. Attach a bounded topic hypothesis to your local strategy brief, without a fake live feed.",
  "/trends",
);

export default function TrendsPage() { return <TrendsClient />; }
