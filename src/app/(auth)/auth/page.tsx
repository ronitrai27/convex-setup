import { Github, ShieldCheck, Zap, Globe, LucideGithub } from "lucide-react";
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
        <div className="absolute top-0 left-80 w-full max-w-4xl h-[500px] bg-blue-500/25 blur-[160px] rounded-full pointer-events-none " />
        <div className="absolute bottom-10 -right-20 w-full max-w-2xl h-[260px] bg-gray-50/25 blur-[160px] rounded-full pointer-events-none " />

        <div className="max-w-6xl w-full relative z-10 grid lg:grid-cols-2 gap-12 items-center justify-center h-full">
          {/* Left Side: Value Prop */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-medium text-neutral-400 tracking-wider uppercase">
                <span className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                Try For Free, Beta Version
              </div>
              <h1 className="text-5xl md:text-7xl font-bold  tracking-tight leading-[1.05]">
                The platform <br /> for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
                  Modern Collaboration.
                </span>
              </h1>
              <p className="text-base text-neutral-400 leading-relaxed max-w-md">
                WeKraft turns your GitHub activity into actionable insights.From
                collaboration To deployments — everything is tracked and
                automated.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Zap,
                  title: "Ultra Fast",
                  desc: "Optimized for speed.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure",
                  desc: "Enterprise-grade protection.",
                },
                {
                  icon: Globe,
                  title: "Collab",
                  desc: "Collaborate Seamlessly.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-colors"
                >
                  <feature.icon className="size-5 text-neutral-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-neutral-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Sleek Login Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[400px] space-y-8">
              <div className="p-10 rounded-lg  bg-linear-to-b from-black via-black/70 to-transparent   relative group">
                {/* Subtle Border Glow */}
                <div className="absolute -inset-px bg-linear-to-b from-white/10 to-transparent rounded-lg -z-10 group-hover:from-white/20 transition-all duration-500" />

                <div className="space-y-8 text-center">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Login to We<span className="italic">Kraft</span>
                    </h2>
                    <p className="text-[13px] text-neutral-500">
                      Start Collaboration by Continuing With GitHub
                    </p>
                  </div>

                  <div className="space-y-5">
                    <SignInButton>
                      <Button className="w-full h-10 bg-white text-black hover:bg-neutral-200 text-sm font-medium flex items-center justify-center gap-3 transition-all rounded-lg">
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
              <div className="text-center">
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
