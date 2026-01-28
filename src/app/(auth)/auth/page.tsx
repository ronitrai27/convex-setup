import {
  Github,
  ShieldCheck,
  Zap,
  Globe,
  LucideGithub,
  LucidePhone,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Design from "./_components/design";
// import { toast } from "sonner";

export default async function LoginPage() {
  const { userId } = await auth();

  // 🔐 If session exists → auto redirect
  // but also check if user has completed onboarding or not !
  if (userId) {
    // toast(`Welcome back!`);
    redirect("/auth/callback");
  }
  return (
    <div className="h-screen bg-black text-white selection:bg-white selection:text-black font-sans dark">
      <main className="relative h-full flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[36px_36px]" />
          <div className="absolute -top-40 left-95 w-full max-w-[720px] h-[500px] bg-blue-500/30 blur-[160px] rounded-full pointer-events-none" />
        </div>

        <div className="max-w-6xl w-full z-10 grid lg:grid-cols-2 gap-12 items-center justify-center h-full relative">
          <div className="space-y-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-medium text-neutral-400 tracking-wider uppercase">
              <span className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              New Era of Development
            </div>
            {/* main text */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-[64px] font-semibold  tracking-normal leading-[1.05] font-pop">
                The Platform for <br />
                <span className="text-transparent bg-clip-text bg-linear-to-b from-white to-neutral-500  font-sans font-bold">
                  Modern Collaboration.
                </span>
              </h1>
              <p className="text-base text-neutral-400 leading-relaxed max-w-md">
                WeKraft turns your GitHub activity into actionable insights.
                From collaboration To deployments — everything is tracked and
                automated.
              </p>
            </div>

            <div className="">
              <Design />
            </div>
            {/* <div className="grid sm:grid-cols-3 gap-4 relative">
              {[
                {
                  icon: Zap,
                  title: "Ultra Fast",
                  desc: "Optimized for speed.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure",
                  desc: "Security First.",
                },
                {
                  icon: Globe,
                  title: "Collab",
                  desc: "Collab Seamlessly.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 z-10 rounded-xl border border-white/5 bg-linear-to-br from-gray-950 to-gray-900 transition-colors"
                >
                  <feature.icon className="size-5 text-neutral-100 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-neutral-300 whitespace-nowrap">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div> */}
          </div>

          <div className="flex justify-center lg:justify-end ">
            {/* CARD LOGIN */}
            <div className="w-full max-w-[400px] space-y-8">
              <div className="p-10 rounded-lg  bg-linear-to-b from-black via-black/60  to-transparent   relative group">
                <div className="absolute -inset-px bg-linear-to-b from-white/10 to-transparent rounded-lg -z-10 group-hover:from-white/20 transition-all duration-500" />

                <div className="space-y-7 text-center">
                  <div className="flex items-center justify-center">
                    <Image src="/logo.svg" alt="Logo" width={40} height={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Login to <span className="font-pop">WeKraft</span>
                    </h2>
                    <p className="text-[13px] text-neutral-500">
                      Start Collaboration by Continuing With GitHub
                    </p>
                  </div>

                  <div className="space-y-5">
                    <SignInButton>
                      <Button className="w-full h-9 bg-white text-black hover:bg-neutral-200 text-sm font-medium flex items-center justify-center gap-3 transition-all rounded-lg">
                        <Github className="size-5 shrink-0" />
                        Continue with GitHub
                      </Button>
                    </SignInButton>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                      <span className="bg-gray-900 px-3 text-neutral-600">
                        Secure & Fast
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-relaxed text-balance">
                    By joining, you agree to WeKraft
                    <Link
                      href="#"
                      className="text-neutral-300 hover:text-white underline underline-offset-4 mx-1"
                    >
                      Terms
                    </Link>
                    and
                    <Link
                      href="#"
                      className="text-neutral-300 hover:text-white underline underline-offset-4 mx-1"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="text-center bg-linear-to-br from-gray-800 to-black w-fit mx-auto py-2 px-4 rounded-full -mb-10">
                <p className="text-xs italic hover:underline cursor-pointer">
                  Star WeKraft on GitHub{" "}
                  <LucideGithub className="inline ml-2" size={20} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
