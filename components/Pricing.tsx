import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

enum PopularPlanType {
    NO = 0,
    YES = 1,
}

interface PricingProps {
    title: string;
    popular: PopularPlanType;
    price: number;
    description: string;
    buttonText: string;
    benefitList: string[];
}

const pricingList: PricingProps[] = [
    {
        title: "Starter",
        popular: 0,
        price: 99,
        description:
            "Perfect for testing campaigns and small-scale engagement.",
        buttonText: "Get Started",
        benefitList: [
            "25 accounts",
            "5K comments/month",
            "3 platforms",
            "Basic analytics",
            "Email support",
        ],
    },
    {
        title: "Growth",
        popular: 1,
        price: 299,
        description:
            "For teams scaling their social media presence seriously.",
        buttonText: "Start Now",
        benefitList: [
            "100 accounts",
            "25K comments/month",
            "All platforms",
            "Advanced analytics",
            "Ads campaign management",
        ],
    },
    {
        title: "Enterprise",
        popular: 0,
        price: 799,
        description:
            "Full-scale automation for agencies and large operations.",
        buttonText: "Contact Us",
        benefitList: [
            "Unlimited accounts",
            "Unlimited comments",
            "Custom integrations",
            "Dedicated proxy pool",
            "Priority support",
        ],
    },
];

const Pricing = () => {
    return (
        <section id="pricing" className="container py-24 sm:py-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center">
                Choose Your
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    {" "}
                    Automation{" "}
                </span>
                Plan
            </h2>
            <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
                Scale from small campaigns to enterprise-level automation.
                All plans include AI-powered engagement.
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pricingList.map((pricing: PricingProps) => (
                    <Card
                        key={pricing.title}
                        className={
                            pricing.popular === PopularPlanType.YES
                                ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10"
                                : ""
                        }
                    >
                        <CardHeader>
                            <CardTitle className="flex item-center justify-between">
                                {pricing.title}
                                {pricing.popular === PopularPlanType.YES ? (
                                    <Badge
                                        variant="secondary"
                                        className="text-sm text-primary"
                                    >
                                        Most popular
                                    </Badge>
                                ) : null}
                            </CardTitle>
                            <div>
                                <span className="text-3xl font-bold">
                                    ${pricing.price}
                                </span>
                                <span className="text-muted-foreground">
                                    {" "}
                                    /month
                                </span>
                            </div>

                            <CardDescription>
                                {pricing.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Button className="w-full">
                                {pricing.buttonText}
                            </Button>
                        </CardContent>

                        <hr className="w-4/5 m-auto mb-4" />

                        <CardFooter className="flex">
                            <div className="space-y-4">
                                {pricing.benefitList.map((benefit: string) => (
                                    <span key={benefit} className="flex">
                                        <Check className="text-green-500" />{" "}
                                        <h3 className="ml-2">{benefit}</h3>
                                    </span>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default Pricing;
