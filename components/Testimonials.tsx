import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface TestimonialProps {
    image: string;
    name: string;
    userName: string;
    comment: string;
}

const testimonials: TestimonialProps[] = [
    {
        image: "https://github.com/shadcn.png",
        name: "Marketing Team",
        userName: "@growth_ops",
        comment: "3x engagement increase in the first month. The AI comments actually get replies and drive conversations.",
    },
    {
        image: "https://github.com/shadcn.png",
        name: "Social Lead",
        userName: "@social_strategy",
        comment:
            "Managing 200+ accounts used to be a nightmare. Now it runs on autopilot with better results than manual posting.",
    },
    {
        image: "https://github.com/shadcn.png",
        name: "Campaign Manager",
        userName: "@campaign_mgr",
        comment:
            "The FOMO triggers are incredibly effective. Scarcity + urgency messaging drove a 40% conversion lift on our last launch.",
    },
    {
        image: "https://github.com/shadcn.png",
        name: "Agency Director",
        userName: "@agency_growth",
        comment:
            "Zero account bans in 6 months. The proxy rotation and human-like delays actually work. Finally, safe automation at scale.",
    },
    {
        image: "https://github.com/shadcn.png",
        name: "Ads Specialist",
        userName: "@paid_social",
        comment:
            "Unified ads management across platforms saved us hours daily. The budget optimization alone paid for the subscription.",
    },
    {
        image: "https://github.com/shadcn.png",
        name: "Content Team",
        userName: "@content_ops",
        comment:
            "AI comment templates learn our brand voice. Comments sound authentic because they're contextually generated, not copy-pasted.",
    },
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="container py-24 sm:py-32">
            <h2 className="text-3xl md:text-4xl font-bold">
                What
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    {" "}
                    Teams{" "}
                </span>
                Are Saying
            </h2>

            <p className="text-xl text-muted-foreground pt-4 pb-8">
                Internal teams trust FOMO Engine for scalable engagement
                that drives real business results.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 sm:block columns-2 lg:columns-3 lg:gap-6 mx-auto space-y-4 lg:space-y-6">
                {testimonials.map(
                    ({ image, name, userName, comment }: TestimonialProps) => (
                        <Card
                            key={userName}
                            className="max-w-md md:break-inside-avoid overflow-hidden"
                        >
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar>
                                    <AvatarImage alt="" src={image} />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col">
                                    <CardTitle className="text-lg">
                                        {name}
                                    </CardTitle>
                                    <CardDescription>
                                        {userName}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent>{comment}</CardContent>
                        </Card>
                    )
                )}
            </div>
        </section>
    );
};

export default Testimonials;
