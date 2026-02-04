"use client";

import Link from "next/link";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { ModeToggle } from "./ModeToggle";
import { Logo } from "./Logo";

const Navbar = () => {
    return (
        <nav className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
            <NavigationMenu className="mx-auto">
                <div className="container h-14 px-4 w-screen flex justify-between items-center">
                    <Link href="/" className="font-bold text-xl flex">
                        <Logo />
                    </Link>
                    <ModeToggle />
                </div>
            </NavigationMenu>
        </nav>
    );
};

export default Navbar;
