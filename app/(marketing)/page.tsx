import { redirect } from "next/navigation";

// The front door is the shield. (The old FOMO marketing site lived here; it's gone.)
export default function Home() {
    redirect("/check");
}
