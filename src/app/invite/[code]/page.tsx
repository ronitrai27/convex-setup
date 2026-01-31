"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // Assuming sonner is used based on list_dir
import {
  ChevronLeft,
  Loader2,
  LucideExternalLink,
  LucideLogIn,
  LucideUser2,
} from "lucide-react";
import Link from "next/link";

const InvitePage = () => {
  const params = useParams();
  const inviteLink = params.code as string;
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

  const prefix = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : "http://localhost:3000/invite/";
  const fullInviteLink = `${prefix}${inviteLink}`;

  console.log("fullInviteLink->", fullInviteLink);

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // getting project by code...
  const project = useQuery(api.projects.getProjectByInviteLink, {
    inviteLink: fullInviteLink || "",
  });
  console.log("project by invite link->", project);
  const requestJoin = useMutation(api.projects.requestJoinProject);

  const handleLogin = () => {
    // Redirect to auth page, preserving the return url if needed
    // For now simple redirect as per requested flow
    router.push("/auth");
  };

  const handleJoinRequest = async () => {
    if (!project) return;

    setIsSubmitting(true);
    try {
      await requestJoin({
        projectId: project._id,
        message: message,
        source: "invited",
      });
      toast.success("Join request sent successfully!");
      setIsOpen(false);
      setMessage("");
    } catch (error: any) {
      toast.error("Failed to send join request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (project === undefined || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 md:p-8 relative bg-black">
        <Image
          src="/a1.jpg"
          alt="bg-image"
          fill
          className="absolute w-full h-full object-cover opacity-25"
        />

        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-500/40 blur-[200px] rounded-full pointer-events-none opacity-50" />

        <div className="absolute top-6 left-6 flex z-50 bg-white/10 p-5 rounded-lg backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="logo" width={35} height={35} />
            <h1 className="text-xl font-bold text-white">WeKraft</h1>
          </div>
          <div className="ml-4 flex items-center gap-2 text-white">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Invalid Invite - Project not found
  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 md:p-8 relative bg-black">
        <Image
          src="/a1.jpg"
          alt="bg-image"
          fill
          className="absolute w-full h-full object-cover opacity-25"
        />

        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-500/40 blur-[200px] rounded-full pointer-events-none opacity-50" />

        {/* main page */}
        <div className=" flex flex-col z-50 bg-white/10 p-3 rounded-lg backdrop-blur-md w-full max-w-md">
          <div className="flex items-center gap-3 justify-center w-full">
            <Image src="/logo.svg" alt="logo" width={35} height={35} />
            <h1 className="text-xl font-bold text-white">WeKraft</h1>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              Invalid Invite
            </h2>
            <p className="text-gray-300">
              The invite link you followed is invalid or has expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 md:p-8 relative bg-black">
      <Image
        src="/a1.jpg"
        alt="bg-image"
        fill
        className="absolute w-full h-full object-cover opacity-25"
      />

      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-blue-500/40 blur-[200px] rounded-full pointer-events-none opacity-50" />

      {/* Invite Card */}
      <div className="z-10 bg-white/10 p-4 rounded-lg backdrop-blur-md max-w-md w-full">
        <div className="flex items-center gap-3 w-full justify-center my-4">
          <Image src="/logo.svg" alt="logo" width={35} height={35} />
          <h1 className="text-xl font-bold text-white">WeKraft</h1>
        </div>
        <div className="text-center mb-6">
          <p className="text-white text-base mb-2">
            You've been invited to join Team
          </p>
          <h1 className="text-xl font-bold text-white capitalize mb-2">
            {project.projectName}
          </h1>

          <p className="text-white flex items-center justify-center gap-2">
            Owner:
            <span className="font-semibold text-blue-500">
              {project.ownerName ? project?.ownerName : project?.repoOwner}
            </span>
          </p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6 w-full">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className=" h-9 bg-white text-black cursor-pointer text-xs ">
                    Join Team <LucideExternalLink />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md ">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      Join {project.projectName}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Enter Why you want to Join? (Optional)
                      </label>
                      <Textarea
                        placeholder="Hey, I'd love to join your project!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className=" min-h-[100px] mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleJoinRequest}
                      size="sm"
                      disabled={isSubmitting}
                      className="w-full mt-4 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        "Send Request"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            <Link href="/dashboard" >
              <Button className=" h-9 bg-white text-black cursor-pointer text-xs">
                <ChevronLeft /> Go Back
              </Button>
            </Link>
            </div>
            <p className="text-xs text-center text-white">
              You're logged in. A request will be sent to the owner.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              className="w-full h-9 bg-white text-black cursor-pointer"
            >
              Login to Join <LucideLogIn />
            </Button>
            <p className="text-xs text-center text-white">
              You need to be logged in to join this project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
