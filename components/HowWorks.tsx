import { Icons } from "./Icons";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface FeatureProps {
    icon: JSX.Element;
    title: string;
    description: string;
}

const features: FeatureProps[] = [
    {
        icon: (
            <Icons.accessibility className="dark:text-orange-500 text-blue-500 w-7 h-7" />
        ),
        title: "1. Connect Accounts",
        description:
            "Add your social media accounts with proxy configuration. Our warm-up system prepares them for safe automation.",
    },
    {
        icon: (
            <Icons.people className="dark:text-orange-500 text-blue-500 w-7 h-7" />
        ),
        title: "2. Configure Campaign",
        description:
            "Set up comment templates, targeting criteria, and engagement rules. AI generates contextual variations.",
    },
    {
        icon: (
            <Icons.scale className="dark:text-orange-500 text-blue-500 w-7 h-7" />
        ),
        title: "3. Deploy & Monitor",
        description:
            "Launch your campaign with intelligent scheduling. Real-time monitoring tracks engagement and account health.",
    },
    {
        icon: (
            <Icons.gamification className="dark:text-orange-500 text-blue-500 w-7 h-7" />
        ),
        title: "4. Analyze & Scale",
        description:
            "Review performance analytics, optimize campaigns, and scale what works. FOMO triggers drive conversions.",
    },
];

const HowWorks = () => {
    return (
        <section
            id="howItWorks"
            className="container text-center py-24 sm:py-32"
        >
            <h2 className="text-3xl md:text-4xl font-bold ">
                How It{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    Works{" "}
                </span>
            </h2>
            <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
                From account setup to scaled engagement in four simple steps.
                Our automation pipeline handles everything seamlessly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map(({ icon, title, description }: FeatureProps) => (
                    <Card key={title} className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="grid gap-4 place-items-center">
                                {icon}
                                {title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>{description}</CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default HowWorks;
