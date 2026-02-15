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
  GitBranchPlus,
  LucideUser,
  Lock,
  Unlock,
  Loader2,
  Copy,
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

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { RepositoryList } from "./use-repo";
import {
  generateInviteCode,
  getInviteLink,
  shareViaWhatsApp,
  shareViaGmail,
  shareViaDiscord,
} from "@/lib/invite";
import { Doc } from "../../../convex/_generated/dataModel";

export function MultiStepOnboarding() {
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser,
  );
  const [currentStep, setCurrentStep] = React.useState(1);
  const [direction, setDirection] = React.useState(0);
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);
  const createProject = useMutation(api.projects.create);
  const storedRepo = useQuery(api.repos.getRepository);
  const router = useRouter();

  // Loading state for async operations
  const [isLoading, setIsLoading] = React.useState(false);

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
  const [isPublic, setIsPublic] = React.useState(true);

  // Auto-fill project name from connected repo
  React.useEffect(() => {
    if (storedRepo && !projectName) {
      // setProjectName(storedRepo.name);
      // Default to private if we could detect it, but for now default to public or whatever logic
    }
  }, [storedRepo, projectName]);

  // Step 4 State
  // const [inviteEmail, setInviteEmail] = React.useState("");
  // const [invitedEmails, setInvitedEmails] = React.useState<string[]>([]);
  const [inviteLink, setInviteLink] = React.useState("");
  React.useEffect(() => {
    if (!inviteLink) {
      setInviteLink(getInviteLink(generateInviteCode()));
    }
  }, [inviteLink]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied to clipboard");
  };

  const [localConnectingId, setLocalConnectingId] = React.useState<
    number | null
  >(null);

  const handleNext = async () => {
    if (currentStep === 3) {
      // Validate Tags
      if (selectedTags.length < 2) {
        toast.error("Please select at least 2 tags", {
          description: "Tags help organize and discover your project.",
        });
        return;
      }
      if (selectedTags.length > 5) {
        toast.error("Please select at most 5 tags");
        return;
      }

      if (!storedRepo) {
        toast.error("No repository connected", {
          description: "Please go back and connect a repository.",
        });
        return;
      }

      setIsLoading(true);
      try {
        await createProject({
          projectName,
          description: "", // Optional at start , can be updated later
          tags: selectedTags,
          isPublic,
          repositoryId: storedRepo._id,
          repoName: storedRepo.name,
          repoFullName: storedRepo.fullName,
          repoOwner: storedRepo.owner,
          repoUrl: storedRepo.url,
          inviteLink: inviteLink,
          ownerName: user?.name!,
          ownerImage: user?.imageUrl!,
        });

        setDirection(1);
        setCurrentStep((prev) => prev + 1);
        toast.success("Project details saved!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to save project details");
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep < 4) {
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
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
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
    <div className="dark flex flex-col items-center justify-center min-h-screen p-4 md:p-8 relative text-foreground">
      <Image
        src="/a1.jpg"
        alt="bg-image"
        fill
        className="absolute w-full h-full object-cover opacity-25"
      />

      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-500/40 blur-[200px] rounded-full pointer-events-none opacity-50" />

      {/* Progress Header */}
      <div className="flex items-center gap-3 mb-12">
        {STEPS.map((step) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border text-sm transition-all duration-300",
                currentStep >= step.id
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-muted-foreground border-white/40",
              )}
            >
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            {step.id < 4 && (
              <div
                className={cn(
                  "w-8 h-[1px] transition-colors duration-300",
                  currentStep > step.id ? "bg-white" : "bg-white/40",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* BODY  */}
      <div className="w-full max-w-xl  bg-linear-to-b from-white/40 to-transparent rounded-2xl overflow-hidden font-sans">
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
                      Identity <LucideUser className="w-5 h-5 inline ml-2" />
                    </h2>
                    <p className="text-muted-foreground">
                      Hey Dev. Welcome to WeKraft. Let's get started.
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

              {/* HERE NEED TO ADD A CONNECT BUTTON WITH REPO TO CONNECT AND SYNC */}
              {currentStep === 2 && (
                <div className="space-y-4 relative">
                  <div className="space-y-1">
                    <h2 className="text-2xl text-white font-semibold tracking-tight">
                      Connect <GitBranchPlus className="w-5 h-5 inline ml-2" />
                    </h2>
                    <p className="text-muted-foreground">
                      Select any 1 repository to import into your new project.
                    </p>
                  </div>

                  <div className="relative flex items-center">
                    <Search className="absolute left-3 top-2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repositories..."
                      className="bg-white/5 border-white/10 pl-10 mb-4 focus:ring-1 focus:ring-white/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <RepositoryList
                    searchQuery={searchQuery}
                    selectedRepo={selectedRepo!}
                    setSelectedRepo={setSelectedRepo}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 relative">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Lets Create Your Project
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
                        placeholder={storedRepo?.name}
                        className="bg-white/5 border-white/10 focus:ring-1 focus:ring-white/20"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Tags{" "}
                        <span className="text-[10px] normal-case opacity-50 ml-2">
                          (Min 2, Max 5)
                        </span>
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
                                : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30",
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {selectedTags.length < 2 && selectedTags.length > 0 && (
                        <p className="text-[10px] text-red-400">
                          Select at least {2 - selectedTags.length} more tag(s)
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Visibility
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setIsPublic(true)}
                          className={cn(
                            "cursor-pointer p-2 rounded-xl border flex items-center gap-3 transition-all",
                            isPublic
                              ? "bg-white/10 border-white text-white"
                              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10",
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              isPublic ? "bg-white text-black" : "bg-white/10",
                            )}
                          >
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Public</span>
                            <span className="text-[10px] opacity-70">
                              Everyone can see
                            </span>
                          </div>
                        </div>

                        <div
                          onClick={() => setIsPublic(false)}
                          className={cn(
                            "cursor-pointer p-2 rounded-xl border flex items-center gap-3 transition-all",
                            !isPublic
                              ? "bg-white/10 border-white text-white"
                              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10",
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              !isPublic ? "bg-white text-black" : "bg-white/10",
                            )}
                          >
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Private</span>
                            <span className="text-[10px] opacity-70">
                              Only you can see
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2 ">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Step 4: Collaborate
                    </h2>
                    <p className="text-muted-foreground">
                      Invite your team members to join the project.
                    </p>
                  </div>

                  <div className="space-y-4 relative">
                    <div className="flex gap-5 items-center">
                      <div className="bg-muted/40 text-sm py-1.5 px-5 border border-accent rounded-xl w-full">
                        {inviteLink}
                      </div>
                      <Button
                        className="cursor-pointer text-xs"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        Copy <Copy className="size-4 ml-2" />
                      </Button>
                    </div>
                    {/* Other ways to Invite */}
                    <div>
                      <div className="flex items-center justify-center gap-4">
                        <hr className="w-30 border-white/20" />
                        <p className="text-sm text-muted-foreground">
                          Invite Via
                        </p>
                        <hr className="w-30 border-white/20" />
                      </div>
                      <div className="flex items-center justify-evenly mt-4 px-12">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            shareViaWhatsApp(
                              inviteLink,
                              projectName || storedRepo?.name || "New Project",
                            )
                          }
                        >
                          <Image
                            src="/whatsapp.png"
                            alt="whatsapp"
                            width={30}
                            height={30}
                            className=""
                          />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            shareViaGmail(
                              inviteLink,
                              projectName || storedRepo?.name || "New Project",
                            )
                          }
                        >
                          <Image
                            src="/gmail.png"
                            alt="gmail"
                            width={30}
                            height={30}
                            className=""
                          />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            shareViaDiscord(inviteLink);
                            toast.success("Link copied and opening Discord");
                          }}
                        >
                          <Image
                            src="/dis.png"
                            alt="discord"
                            width={30}
                            height={30}
                            className=""
                          />
                        </Button>
                      </div>
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
            disabled={isLoading}
            className="bg-gray-400 text-xs text-black hover:bg-white/80 font-medium px-8 transition-all active:scale-95 z-10 cursor-pointer"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
            {currentStep === 4 ? "Complete" : "Continue"}
            {currentStep !== 4 && !isLoading && (
              <ChevronRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-black/60 blur-[120px]  pointer-events-none " />
    </div>
  );
}
