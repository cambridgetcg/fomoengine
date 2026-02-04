import Statistics from "./Statistics";

const About = () => {
    return (
        <section id="about" className="container py-24 sm:py-32">
            <div className="bg-muted/50 border rounded-lg py-12">
                <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
                    <img
                        src="./pilot.png"
                        alt="FOMO Engine"
                        className="w-[300px] object-contain rounded-lg"
                    />
                    <div className="flex flex-col justify-between">
                        <div className="pb-6">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                                    About{" "}
                                </span>
                                FOMO Engine
                            </h2>
                            <p className="text-xl text-muted-foreground mt-4">
                                FOMO Engine is an internal social media automation platform
                                designed to drive engagement at scale. We combine AI-powered
                                commenting, strategic account management, and FOMO triggers
                                to maximize your social media ROI.
                            </p>
                            <p className="text-xl text-muted-foreground mt-4">
                                Our pipeline seamlessly connects account pools, comment
                                automation, ads campaigns, and analytics into a unified
                                workflow. Built for multi-platform engagement with
                                intelligent scheduling and proxy management.
                            </p>
                        </div>

                        <Statistics />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
