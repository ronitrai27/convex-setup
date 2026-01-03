"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Settings, Sparkles, Ticket } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { BarLoader } from "react-spinners";
import { useStoreUser } from "@/hooks/use-user-store";

export function Navbar() {
  const { isLoading } = useStoreUser();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5 bg-black/20">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Rocket className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">WeKraft</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          href="#features"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Platform
        </Link>
        <Link
          href="#pricing"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="#docs"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Documentation
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium">
          Sign in
        </Button>
        <Button className="rounded-full px-6 text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 active:scale-95">
          Get Started
        </Button> */}
        {/* CLERK BUTTONS  WITH CONVEX !!*/}

        <Button>Get Demo</Button>
        <Authenticated>
          <Button>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link
                label="My-Tickets"
                href="/my-tickets"
                labelIcon={<Ticket />}
              />
              <UserButton.Link
                label="Settings"
                href="/settings"
                labelIcon={<Settings />}
              />
            </UserButton.MenuItems>
          </UserButton>
        </Authenticated>

        <Unauthenticated>
          {/* <SignInButton>
            <Button className="rounded-full px-6 text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 active:scale-95">
              Get Started
            </Button>
          </SignInButton> */}
          <Button>
            <Link href="/auth">Get Started</Link>
          </Button>
        </Unauthenticated>
      </div>

      {/* LOADERS */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full">
          <BarLoader width={"100%"} color="#6c47ff" />
        </div>
      )}
    </nav>
  );
}

//  <SignUpButton>
//             <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
//               Sign Up
//             </button>
//           </SignUpButton>
