"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Plus,
  X,
  Github,
  Send,
  User,
  Globe,
  Phone,
  Briefcase,
  Layers,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Repository", icon: Github },
  { id: 3, title: "Project Details", icon: Layers },
  { id: 4, title: "Team", icon: Users },
];

const TAG_OPTIONS = ["AI", "Web3", "ML", "SaaS", "DevTools", "Open Source"];

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

export function MultiStepOnboarding() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [direction, setDirection] = React.useState(0);
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);
  const router = useRouter();

  // Step 1 State
  const [occupation, setOccupation] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+1");
  const [phone, setPhone] = React.useState("");

  // Step 2 State
  const [selectedRepo, setSelectedRepo] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Step 3 State
  const [projectName, setProjectName] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  // Step 4 State
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [invitedEmails, setInvitedEmails] = React.useState<string[]>([]);

  const handleNext = async () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      // HANDLE COMPLETION
      try {
        // toast.promise wouldn't handle the redirect cleanly inside the promise, so manual approach:
        const toastId = toast.loading("Saving your onboarding progress...");

        await completeOnboardingMutation();

        toast.dismiss(toastId);
        toast.success("Welcome aboard! Redirecting to Dashboard...");

        router.push("/dashboard");
      } catch (error) {
        console.error("Onboarding failed", error);
        toast.error("Failed to complete onboarding. Please try again.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addInvite = () => {
    if (inviteEmail && !invitedEmails.includes(inviteEmail)) {
      setInvitedEmails((prev) => [...prev, inviteEmail]);
      setInviteEmail("");
    }
  };

  const removeInvite = (email: string) => {
    setInvitedEmails((prev) => prev.filter((e) => e !== email));
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 relative">
      <Image
        src="/a1.jpg"
        alt="bg-image"
        fill
        className="absolute w-full h-full object-cover opacity-20"
      />

      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-500/40 blur-[200px] rounded-full pointer-events-none opacity-50" />

      {/* <div className="size-10 bg-white rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-10">
        <span className="text-black font-black text-2xl leading-none">W</span>
      </div> */}
      {/* Progress Header */}
      <div className="flex items-center gap-3 mb-12">
        {STEPS.map((step) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border text-sm transition-all duration-300",
                currentStep >= step.id
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-muted-foreground border-white/10"
              )}
            >
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            {step.id < 4 && (
              <div
                className={cn(
                  "w-8 h-[1px] transition-colors duration-300",
                  currentStep > step.id ? "bg-white" : "bg-white/10"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* BODY  */}
      <div className="w-full max-w-xl  bg-linear-to-b from-white/30 to-transparent rounded-2xl overflow-hidden font-sans">
        <div className="p-8 ">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {currentStep === 1 && (
                <div className="space-y-6 relative">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                      Step 1: Identity
                    </h2>
                    <p className="text-muted-foreground">
                      Tell us a bit about yourself to get started.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="occupation"
                        className="text-xs uppercase tracking-widest text-muted-foreground"
                      >
                        Current Occupation
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="occupation"
                          placeholder="Software Engineer, Designer..."
                          className="bg-white/5 border-white/10 pl-10 focus:ring-1 focus:ring-white/20 transition-all"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-1 space-y-2">
                        <Label
                          htmlFor="code"
                          className="text-xs uppercase tracking-widest text-muted-foreground"
                        >
                          Code
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="code"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-white/5 border-white/10 pl-10 focus:ring-1 focus:ring-white/20 text-white"
                            placeholder="+91"
                          />
                        </div>
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-xs uppercase tracking-widest text-muted-foreground"
                        >
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            placeholder="555-0123"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-white/5 border-white/10 pl-10 focus:ring-1 focus:ring-white/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5 relative">
                  <div className="space-y-2">
                    <h2 className="text-2xl text-white font-semibold tracking-tight">
                      Step 2: Connect
                    </h2>
                    <p className="text-muted-foreground">
                      Select a repository to import into your new project.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repositories..."
                      className="bg-white/5 border-white/10 pl-10 mb-4 focus:ring-1 focus:ring-white/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-55 overflow-y-auto pr-2 custom-scrollbar">
                    {[
                      "v0-ui-kit",
                      "next-enterprise-starter",
                      "acme-saas",
                      "modern-dashboard",
                    ].map((repo) => (
                      <button
                        key={repo}
                        onClick={() => setSelectedRepo(repo)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-xl border transition-all duration-200 group",
                          selectedRepo === repo
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white border-white/5 hover:border-white/20  hover:bg-white/[0.07]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Github
                            className={cn(
                              "w-5 h-5",
                              selectedRepo === repo
                                ? "text-black"
                                : "text-muted-foreground"
                            )}
                          />
                          <span className="font-medium">{repo}</span>
                        </div>
                        {selectedRepo === repo && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Step 3: Define
                    </h2>
                    <p className="text-muted-foreground">
                      Name your project and add relevant category tags.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="projectName"
                        className="text-xs uppercase tracking-widest text-muted-foreground"
                      >
                        Project Name
                      </Label>
                      <Input
                        id="projectName"
                        placeholder="My Awesome App"
                        className="bg-white/5 border-white/10 focus:ring-1 focus:ring-white/20"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Suggested Tags
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                              selectedTags.includes(tag)
                                ? "bg-white text-black border-white"
                                : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Step 4: Collaborate
                    </h2>
                    <p className="text-muted-foreground">
                      Invite your team members to join the project.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="email@example.com"
                          className="bg-white/5 border-white/10 pl-10 focus:ring-1 focus:ring-white/20"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addInvite()}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={addInvite}
                        className="bg-white text-black hover:bg-white/90"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Invited Members
                      </Label>
                      {invitedEmails.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic py-2">
                          No invites sent yet...
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {invitedEmails.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                            >
                              <span className="text-sm">{email}</span>
                              <Button
                                onClick={() => removeInvite(email)}
                                className="text-muted-foreground hover:text-white transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20 ">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="text-muted-foreground hover:text-white disabled:opacity-30 transition-all z-10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            className="bg-gray-400 text-xs text-black hover:bg-white/80 font-medium px-8 transition-all active:scale-95 z-10 cursor-pointer"
          >
            {currentStep === 4 ? "Complete" : "Continue"}
            {currentStep !== 4 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-black/60 blur-[120px]  pointer-events-none " />
    </div>
  );
}
