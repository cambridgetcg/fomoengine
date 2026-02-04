"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { useCampaigns, useCampaignMutations } from "@/lib/api/hooks";

type StatusType = "healthy" | "warming" | "flagged" | "inactive" | "active" | "paused" | "draft" | "completed";
import {
    Plus,
    Search,
    MoreVertical,
    Megaphone,
    DollarSign,
    Target,
    TrendingUp,
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CampaignsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const { campaigns, loading, refetch } = useCampaigns({
        status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
        search: search || undefined,
    });
    const { activateCampaign, pauseCampaign } = useCampaignMutations();

    const filteredCampaigns = useMemo(() => campaigns.filter((c) => {
        const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter;
        return matchesSearch && matchesStatus;
    }), [campaigns, search, statusFilter]);

    const toggleStatus = async (id: string, currentStatus: string) => {
        if (currentStatus === "ACTIVE") {
            await pauseCampaign(id);
        } else {
            await activateCampaign(id);
        }
        refetch();
    };

    const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budgetTotal), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.budgetSpent), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Ad Campaigns</h2>
                    <p className="text-muted-foreground">
                        Manage your advertising campaigns and budgets
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{campaigns.length}</p>
                            <p className="text-xs text-muted-foreground">Total Campaigns</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Spent</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Target className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Conversions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                ${totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(0) : 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Budget Used</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Campaigns Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Budget</TableHead>
                                <TableHead>Spent</TableHead>
                                <TableHead>Conversions</TableHead>
                                <TableHead>CPC</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCampaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{campaign.name}</p>
                                            <div className="flex gap-1 mt-1">
                                                {campaign.targetPlatforms.slice(0, 3).map((p) => (
                                                    <Badge key={p} variant="secondary" className="text-xs">
                                                        {p.toLowerCase()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {campaign.status !== "DRAFT" && campaign.status !== "COMPLETED" && (
                                                <Switch
                                                    checked={campaign.status === "ACTIVE"}
                                                    onCheckedChange={() => toggleStatus(campaign.id, campaign.status)}
                                                />
                                            )}
                                            <StatusBadge status={campaign.status.toLowerCase() as StatusType} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">${Number(campaign.budgetDaily)}/day</p>
                                            <p className="text-xs text-muted-foreground">
                                                Total: ${Number(campaign.budgetTotal).toLocaleString()}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="font-medium">${Number(campaign.budgetSpent).toFixed(2)}</p>
                                            <Progress
                                                value={Number(campaign.budgetTotal) > 0 ? (Number(campaign.budgetSpent) / Number(campaign.budgetTotal)) * 100 : 0}
                                                className="h-1.5 w-20"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{campaign.conversions}</p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">
                                            {campaign.cpc > 0 ? `$${Number(campaign.cpc).toFixed(2)}` : "-"}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {filteredCampaigns.length === 0 && (
                <div className="text-center py-12">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No campaigns found</h3>
                    <p className="text-muted-foreground">
                        Create your first campaign to get started
                    </p>
                </div>
            )}
        </div>
    );
}
