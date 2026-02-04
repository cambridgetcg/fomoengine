import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col">
                <DashboardHeader />
                <main className="flex-1 p-4 lg:p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    );
}
