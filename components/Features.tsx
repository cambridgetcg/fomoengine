import { Badge } from "./ui/badge";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface FeatureProps {
    title: string;
    description: string;
    image: string;
}

const features: FeatureProps[] = [
    {
        title: "AI Comment Automation",
        description:
            "Generate contextual, engaging comments that blend naturally into conversations. Sentiment-aware responses that drive replies and engagement.",
        image: "./growth.png",
    },
    {
        title: "Multi-Account Management",
        description:
            "Manage hundreds of accounts with intelligent proxy rotation, session handling, and warm-up sequences. Stay under the radar at scale.",
        image: "./reflecting.png",
    },
    {
        title: "FOMO & Urgency Triggers",
        description:
            "Strategic social proof, scarcity signals, and urgency messaging. Create buzz and drive conversions with psychological triggers.",
        image: "./looking-ahead.png",
    },
];

const featureList: string[] = [
    "Instagram",
    "TikTok",
    "Twitter/X",
    "Facebook",
    "LinkedIn",
    "YouTube",
    "Proxy Rotation",
    "Comment Templates",
    "Analytics Dashboard",
];

const Features = () => {
    return (
        <section id="features" className="container py-24 sm:py-32 space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
                Powerful{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    Automation Features
                </span>
            </h2>

            <div className="flex flex-wrap md:justify-center gap-4">
                {featureList.map((feature: string) => (
                    <div key={feature}>
                        <Badge variant="secondary" className="text-sm">
                            {feature}
                        </Badge>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map(({ title, description, image }: FeatureProps) => (
                    <Card key={title}>
                        <CardHeader>
                            <CardTitle>{title}</CardTitle>
                        </CardHeader>

                        <CardContent>{description}</CardContent>

                        <CardFooter>
                            <img
                                src={image}
                                alt="About feature"
                                className="w-[200px] lg:w-[300px] mx-auto"
                            />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default Features;
