import Link from "next/link";

import { Logo } from "./Logo";

const Footer = () => {
    return (
        <footer id="footer">
            <hr className="w-11/12 mx-auto" />

            <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
                <div className="col-span-full xl:col-span-2">
                    <Link href="/" className="font-bold text-xl flex">
                        <Logo />
                    </Link>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-lg">Product</h3>
                    <div>
                        <a href="#features" className="opacity-60 hover:opacity-100">
                            Features
                        </a>
                    </div>

                    <div>
                        <a href="#pricing" className="opacity-60 hover:opacity-100">
                            Pricing
                        </a>
                    </div>

                    <div>
                        <a href="#faq" className="opacity-60 hover:opacity-100">
                            FAQ
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-lg">Features</h3>
                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Comment Automation
                        </a>
                    </div>

                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Account Management
                        </a>
                    </div>

                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Ads Campaigns
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-lg">Platforms</h3>
                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Instagram
                        </a>
                    </div>

                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            TikTok
                        </a>
                    </div>

                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Twitter/X
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-lg">Resources</h3>
                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Documentation
                        </a>
                    </div>

                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            FOMO Playbook
                        </a>
                    </div>

                    <div>
                        <a href="#" className="opacity-60 hover:opacity-100">
                            Support
                        </a>
                    </div>
                </div>
            </section>

            <section className="container pb-14 text-center">
                <h3>
                    &copy; {new Date().getFullYear()} FOMO Engine. Social Media Automation.
                </h3>
            </section>
        </footer>
    );
};

export default Footer;
