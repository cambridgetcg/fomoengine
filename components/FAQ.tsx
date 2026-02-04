import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
    question: string;
    answer: string;
    value: string;
}

const FAQList: FAQProps[] = [
    {
        question: "Which social media platforms are supported?",
        answer: "We support Instagram, TikTok, Twitter/X, Facebook, LinkedIn, and YouTube. Each platform has optimized automation rules and rate limiting to maintain account safety.",
        value: "item-1",
    },
    {
        question: "How does the AI comment generation work?",
        answer: "Our AI analyzes the target post content, sentiment, and context to generate relevant, natural-sounding comments. You can customize tone, length, and add FOMO triggers to drive engagement.",
        value: "item-2",
    },
    {
        question: "How do you keep accounts safe?",
        answer: "We use residential proxies with intelligent rotation, human-like delays, session persistence, and warm-up sequences. Our system mimics natural behavior patterns to stay under platform detection.",
        value: "item-3",
    },
    {
        question: "Can I manage multiple accounts per platform?",
        answer: "Yes! Growth and Enterprise plans support multiple accounts per platform. Each account gets its own proxy, session, and activity schedule to maintain isolation.",
        value: "item-4",
    },
    {
        question: "What FOMO triggers are available?",
        answer: "We offer scarcity signals (limited spots), urgency triggers (time-sensitive), social proof (others are joining), and exclusivity messaging. All customizable per campaign.",
        value: "item-5",
    },
];

const FAQ = () => {
    return (
        <section id="faq" className="container pt-24 sm:pt-32">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked{" "}
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    Questions
                </span>
            </h2>

            <Accordion
                type="single"
                collapsible
                className="w-full AccordionRoot"
            >
                {FAQList.map(({ question, answer, value }: FAQProps) => (
                    <AccordionItem key={value} value={value}>
                        <AccordionTrigger className="text-left">
                            {question}
                        </AccordionTrigger>

                        <AccordionContent>{answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <h3 className="font-medium mt-4">
                Still have questions?{" "}
                <a
                    href="#"
                    className="text-primary border-primary border-b-2 hover:border-0"
                >
                    Contact us
                </a>
            </h3>
        </section>
    );
};

export default FAQ;
