"use client";

import Link from "next/link";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Icons } from "@/components/Icons";

export const HeroCards = () => {
    return (
        <div className="hidden lg:flex flex-row flex-wrap gap-8 relative w-[700px] h-[500px]">
            {/* Testimonial */}
            <Card className="absolute w-[340px] -top-[15px] drop-shadow-xl shadow-black/10 dark:shadow-white/10">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar>
                        <AvatarImage
                            alt=""
                            src="https://github.com/shadcn.png"
                        />
                        <AvatarFallback>GT</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <CardTitle className="text-lg">Growth Team</CardTitle>
                        <CardDescription>@growth_ops</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>3x engagement increase in just one month. The AI comments actually drive conversations!</CardContent>
            </Card>

            {/* Team */}
            <Card className="absolute right-[20px] top-4 w-80 flex flex-col justify-center items-center drop-shadow-xl shadow-black/10 dark:shadow-white/10">
                <CardHeader className="mt-8 flex justify-center items-center pb-2">
                    <div className="absolute -top-12 rounded-full w-24 h-24 bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                        <Icons.play className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-center">AI Engine</CardTitle>
                    <CardDescription className="font-normal text-primary">
                        FOMO & Engagement Automation
                    </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-2">
                    <p>
                        Contextual comments, urgency triggers, and
                        social proof at scale.
                    </p>
                </CardContent>

                <CardFooter>
                    <div className="flex gap-2">
                        <Badge variant="secondary">Scarcity</Badge>
                        <Badge variant="secondary">Urgency</Badge>
                        <Badge variant="secondary">Proof</Badge>
                    </div>
                </CardFooter>
            </Card>

            {/* Pricing */}
            <Card className="absolute top-[150px] left-[50px] w-72  drop-shadow-xl shadow-black/10 dark:shadow-white/10">
                <CardHeader>
                    <CardTitle className="flex item-center justify-between">
                        Growth
                        <Badge
                            variant="secondary"
                            className="text-sm text-primary"
                        >
                            Most popular
                        </Badge>
                    </CardTitle>
                    <div>
                        <span className="text-3xl font-bold">$299</span>
                        <span className="text-muted-foreground"> /month</span>
                    </div>

                    <CardDescription>
                        Scale your social presence with full automation.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Button className="w-full">Start Now</Button>
                </CardContent>

                <hr className="w-4/5 m-auto mb-4" />

                <CardFooter className="flex">
                    <div className="space-y-4">
                        {[
                            "100 accounts",
                            "25K comments/mo",
                            "All platforms",
                        ].map((benefit: string) => (
                            <div key={benefit} className="flex items-center">
                                <Icons.check className="text-green-500 w-5 h-5" />
                                <h3 className="ml-2">{benefit}</h3>
                            </div>
                        ))}
                    </div>
                </CardFooter>
            </Card>

            {/* Service */}
            <Card className="absolute w-[350px] -right-[10px] bottom-[35px]  drop-shadow-xl shadow-black/10 dark:shadow-white/10">
                <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
                    <div className="mt-1 bg-primary/20 p-3 rounded-2xl">
                        <Icons.accessibility className="h-6 w-6 dark:text-orange-500 text-blue-500" />
                    </div>
                    <div>
                        <CardTitle>Multi-Platform Support</CardTitle>
                        <CardDescription className="text-md mt-2">
                            Instagram, TikTok, Twitter/X, Facebook, LinkedIn.
                            Unified automation across all.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
};
