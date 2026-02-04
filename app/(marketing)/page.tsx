import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import HowWorks from "@/components/HowWorks";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Newsletter from "@/components/Newsletter";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
    return (
        <>
            <Navbar />
            <Hero />
            <About />
            <HowWorks />
            <Features />
            <Services />
            <Testimonials />
            <Pricing />
            <Newsletter />
            <FAQ />
            <Footer />
        </>
    );
}
