import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: LucideIcon;
    className?: string;
}

export function StatCard({ title, value, change, icon: Icon, className }: StatCardProps) {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <Card className={cn("", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {change !== undefined && (
                            <p
                                className={cn(
                                    "text-xs font-medium",
                                    isPositive && "text-green-500",
                                    isNegative && "text-red-500",
                                    !isPositive && !isNegative && "text-muted-foreground"
                                )}
                            >
                                {isPositive && "+"}
                                {change}% from last period
                            </p>
                        )}
                    </div>
                    {Icon && (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
