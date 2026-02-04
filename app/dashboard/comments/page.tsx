"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTemplates, useTemplateMutations } from "@/lib/api/hooks";
import {
    Plus,
    Search,
    MoreVertical,
    MessageSquare,
    TrendingUp,
    Clock,
    Loader2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const platformColors: Record<string, string> = {
    instagram: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    tiktok: "bg-black/10 text-foreground border-black/20",
    twitter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    facebook: "bg-blue-600/10 text-blue-600 border-blue-600/20",
    linkedin: "bg-blue-700/10 text-blue-700 border-blue-700/20",
    youtube: "bg-red-500/10 text-red-500 border-red-500/20",
};

const toneLabels: Record<string, string> = {
    friendly: "Friendly",
    professional: "Professional",
    casual: "Casual",
    urgent: "Urgent",
    fomo: "FOMO",
    FRIENDLY: "Friendly",
    PROFESSIONAL: "Professional",
    CASUAL: "Casual",
    URGENT: "Urgent",
    FOMO: "FOMO",
};

export default function CommentsPage() {
    const [search, setSearch] = useState("");
    const [platformFilter, setPlatformFilter] = useState<string>("all");

    const { templates, loading, refetch } = useTemplates({
        platform: platformFilter === "all" ? undefined : platformFilter,
        search: search || undefined,
    });
    const { updateTemplate } = useTemplateMutations();

    const filteredTemplates = useMemo(() => templates.filter((t) => {
        const matchesSearch = !search ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.content.toLowerCase().includes(search.toLowerCase());
        const matchesPlatform = platformFilter === "all" || t.platform === platformFilter;
        return matchesSearch && matchesPlatform;
    }), [templates, search, platformFilter]);

    const toggleActive = async (id: string, currentActive: boolean) => {
        await updateTemplate(id, { isActive: !currentActive });
        refetch();
    };

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
                    <h2 className="text-2xl font-bold">Comment Templates</h2>
                    <p className="text-muted-foreground">
                        Manage your AI-powered comment templates
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{templates.length}</p>
                            <p className="text-xs text-muted-foreground">Total Templates</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {templates.filter((t) => t.isActive).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {templates.reduce((sum, t) => sum + t.timesUsed, 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Uses</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {filteredTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        {template.platform && (
                                            <Badge
                                                variant="outline"
                                                className={platformColors[template.platform.toLowerCase()] || ""}
                                            >
                                                {template.platform}
                                            </Badge>
                                        )}
                                        <Badge variant="secondary">{toneLabels[template.tone] || template.tone}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={template.isActive}
                                        onCheckedChange={() => toggleActive(template.id, template.isActive)}
                                    />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                &quot;{template.content}&quot;
                            </p>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                    <span className="text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                            {template.timesUsed.toLocaleString()}
                                        </span>{" "}
                                        uses
                                    </span>
                                    <span className="text-muted-foreground">
                                        <span className="font-medium text-green-500">
                                            {template.avgEngagement.toFixed(1)}%
                                        </span>{" "}
                                        eng
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No templates found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filter
                    </p>
                </div>
            )}
        </div>
    );
}
