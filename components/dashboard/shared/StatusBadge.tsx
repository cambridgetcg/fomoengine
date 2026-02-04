import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "healthy" | "warming" | "flagged" | "inactive" | "active" | "paused" | "draft" | "completed";

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    healthy: { label: "Healthy", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    warming: { label: "Warming Up", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    flagged: { label: "Flagged", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    inactive: { label: "Inactive", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    active: { label: "Active", className: "bg-green-500/10 text-green-500 border-green-500/20" },
    paused: { label: "Paused", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    draft: { label: "Draft", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
    completed: { label: "Completed", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <Badge variant="outline" className={cn(config.className, className)}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
            {config.label}
        </Badge>
    );
}
