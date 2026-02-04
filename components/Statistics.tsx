const Statistics = () => {
    interface statsProps {
        quantity: string;
        description: string;
    }

    const stats: statsProps[] = [
        {
            quantity: "10+",
            description: "Platforms Supported",
        },
        {
            quantity: "500+",
            description: "Accounts Managed",
        },
        {
            quantity: "50K+",
            description: "Comments/Day",
        },
        {
            quantity: "3x",
            description: "Engagement Boost",
        },
    ];

    return (
        <section id="statistics">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map(({ quantity, description }: statsProps) => (
                    <div key={description} className="space-y-2 text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold ">
                            {quantity}
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            {description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Statistics;
