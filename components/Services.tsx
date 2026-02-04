import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Icons } from "./Icons";

interface ServiceProps {
    title: string;
    description: string;
    icon: JSX.Element;
}

const serviceList: ServiceProps[] = [
    {
        title: "Comment Campaigns",
        description:
            "Deploy AI-powered commenting at scale. Contextual responses, sentiment matching, and engagement optimization across all platforms.",
        icon: (
            <Icons.play className="h-6 w-6 dark:text-orange-500 text-blue-500" />
        ),
    },
    {
        title: "Account Operations",
        description:
            "Manage account pools with proxy rotation, session persistence, and automated warm-up. Keep accounts healthy and active.",
        icon: (
            <Icons.accessibility className="h-6 w-6 dark:text-orange-500 text-blue-500" />
        ),
    },
    {
        title: "Ads Management",
        description:
            "Create and manage ad campaigns across platforms. Budget allocation, targeting optimization, and performance tracking.",
        icon: (
            <Icons.people className="h-6 w-6 dark:text-orange-500 text-blue-500" />
        ),
    },
];

const Services = () => {
    return (
        <section className="container py-24 sm:py-32">
            <div className="grid lg:grid-cols-[1fr,1fr] gap-8 place-items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold">
                        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                            Core{" "}
                        </span>
                        Capabilities
                    </h2>

                    <p className="text-muted-foreground text-xl mt-4 mb-8 ">
                        Complete social media automation from account setup to
                        engagement analytics. Everything runs on autopilot.
                    </p>

                    <div className="flex flex-col gap-8">
                        {serviceList.map(
                            ({ icon, title, description }: ServiceProps) => (
                                <Card key={title}>
                                    <CardHeader className="space-y-1 flex md:flex-row justify-start items-start gap-4">
                                        <div className="mt-1 bg-primary/20 p-3 rounded-2xl">
                                            {icon}
                                        </div>
                                        <div>
                                            <CardTitle>{title}</CardTitle>
                                            <CardDescription className="text-md mt-2">
                                                {description}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            )
                        )}
                    </div>
                </div>

                <img
                    src="./cube-leg.png"
                    className="w-[300px] md:w-[500px] lg:w-[600px] object-contain"
                    alt="About services"
                />
            </div>
        </section>
    );
};

export default Services;
