"use client";

import { useParams } from "next/navigation";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Github,
  Globe,
  Lock,
  Calendar,
  ExternalLink,
  StarIcon,
  Code,
  LucidePen,
  LucideBrain,
  LucideChevronsLeftRightEllipsis,
  UploadCloud,
  Loader2,
  ImageIcon,
  LucideFileText,
  LucideNotebook,
  LucideSlack,
  LucideExternalLink,
  GitForkIcon,
  LucideActivity,
  LucideInfo,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import StatsTab from "@/modules/my-project/Stats";
import Image from "next/image";
import SettingTab from "@/modules/my-project/settingsTab";
import AboutTab from "@/modules/my-project/Abouttab";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MyProjectId = () => {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  // Fetch project details
  const project = useQuery(api.projects.getProjectById, { projectId });
  const user = useQuery(api.users.getCurrentUser);

  const isPro = user?.type !== "free";
  // -----------------
  const updateThumbnail = useMutation(api.projects.updateThumbnail);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected for upload:", file.name, file.size);

    if (file.size > 1 * 1024 * 1024) {
      alert("File size exceeds 1MB limit");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    // Pass old URL for deletion
    if (project?.thumbnailUrl) {
      formData.append("oldUrl", project.thumbnailUrl);
    }

    try {
      console.log("Sending upload request...");
      const response = await fetch("/api/objects", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed with status: " + response.status);
      }

      const data = await response.json();
      console.log("Upload response data:", data);
      const { url } = data;

      console.log("Updating project thumbnail in DB...");
      await updateThumbnail({
        projectId: projectId,
        thumbnailUrl: url,
      });
      console.log("Project thumbnail updated successfully");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
    }
  };
  // ----------------------------

  const [activeTab, setActiveTab] = useState("home");
  const [homeTab, setHomeTab] = useState("stats");
  if (project === undefined) {
    return <ProjectSkeleton />;
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/dashboard">
          <Button variant="default">Go Back Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-full animate-in fade-in duration-700 p-6 2xl:p-10 2xl:py-7">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* =========================== */}
        {/* TABS */}
        {/* =========================== */}
        <div className="">
          {/* Tab Header */}
          <div className="flex gap-6 px-10 mb-10">
            <Button
              size="sm"
              className="px-10 cursor-pointer"
              variant={activeTab === "home" ? "default" : "outline"}
              onClick={() => setActiveTab("home")}
            >
              Home
            </Button>
            {/* VISIT WORKSPACE DEDICATED PROJECT SPACE */}
            <Link href={`/dashboard/my-projects/${project._id}/workspace`}>
              <Button size="sm" className="px-10 cursor-pointer">
                <LucideExternalLink className="w-4 h-4 inline mr-2" /> Visit
                workspace
              </Button>
            </Link>
          </div>

          {/* TAB HOME */}
          {activeTab === "home" && (
            <>
              {/* =========================== */}
              {/* PROJECT NAME AND CTA  */}
              {/* =========================== */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 mb-5">
                {/* /PROJECT NAME ONLY */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/50 truncate max-w-[450px]">
                    {project.projectName}
                  </h1>
                </div>
                {/* PUBLIC || VIEW REPO  */}
                <div className="flex items-center gap-3">
                  {project.isPublic ? (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-3 py-2 text-emerald-600 bg-emerald-500/20 hover:bg-emerald-500/30"
                    >
                      <Globe className="w-3.5 h-3.5" /> Public
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 px-3 py-1 text-amber-600 bg-amber-500/10 border-amber-500/20"
                    >
                      <Lock className="w-3.5 h-3.5" /> Private
                    </Badge>
                  )}

                  {/* VIEW REPO */}
                  <Link href={project.repoUrl} target="_blank">
                    <Button
                      className="gap-2 shadow-lg shadow-primary/20"
                      size="sm"
                    >
                      <Github className="w-4 h-4" /> View On Github
                    </Button>
                  </Link>
                </div>
              </div>

              {/* =========================== */}
              {/* AWS + CLOUDFRONT THUMBNAIL FOR THE PROJECT */}
              {/* =========================== */}
              <div className="w-[1080px] h-[260px] mx-auto bg-primary/10 rounded-lg overflow-hidden mb-10 relative group border border-border">
                {project.thumbnailUrl ? (
                  <Image
                    src={project.thumbnailUrl}
                    alt="Project Thumbnail"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <p>No thumbnail uploaded</p>
                  </div>
                )}

                {/* Overlay for upload */}
                <div
                  className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isUploading ? "opacity-100" : ""
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p>Uploading...</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center text-white">
                      <UploadCloud className="w-10 h-10 mb-2" />
                      <span className="font-semibold">
                        Click to Upload Thumbnail
                      </span>
                      <span className="text-xs text-white/70 mt-1">
                        1080 x 260 Recommended (Max 1MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* PARENT CONTAINER LEFT SIDE TABS || RIGHT SIDE PROJECT INFO */}
              <div className="flex">
                {/* LEFT SIDE 3 TABS */}
                <div className="w-[65%]">
                  {/* TABS */}
                  <div className="flex gap-6  px-4">
                    <Button
                      size="sm"
                      className="rounded-full px-5 text-[10px]"
                      variant={homeTab === "stats" ? "default" : "outline"}
                      onClick={() => setHomeTab("stats")}
                    >
                      Stats
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full px-5 text-[10px]"
                      variant={homeTab === "setting" ? "default" : "outline"}
                      onClick={() => setHomeTab("setting")}
                    >
                      Setting
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full px-5 text-[10px]"
                      variant={homeTab === "requests" ? "default" : "outline"}
                      onClick={() => setHomeTab("requests")}
                    >
                      Requests
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full px-5 text-[10px]"
                      variant={homeTab === "about" ? "default" : "outline"}
                      onClick={() => setHomeTab("about")}
                    >
                      About
                    </Button>
                  </div>
                  <Separator className="max-w-[99%] mx-auto my-5" />

                  {/* TAB CONTENT */}
                  <div className="px-4">
                    {homeTab === "stats" && (
                      <StatsTab
                        repoName={project.repoName}
                        repoOwner={project.repoOwner}
                        fullProject={project}
                      />
                    )}

                    {/* IN SETTINGS WE WILL CHANGE PROJECT DETAILS TOGGLE LOOKING FOR MEMBERS , TAGS , DESCRIPTION ETC, AND ADD README OR DOC (FUTURE WORK) */}
                    {homeTab === "setting" && (
                      <SettingTab project={project} isPro={isPro} />
                    )}
                    {/* THIS IS THE REQUEST TAB WHERE ALL REQUEST WILL BE SHOWN */}
                    {/* {homeTab === "requests" && <RequestsTab />} */}
                    {/* THIS IS THE ABOUT TAB WHERE EITHER README CONTENT OR GENERATED DOC WILL BE SHOWN! */}
                    {homeTab === "about" && (
                      <AboutTab project={project} isPro={isPro} />
                    )}
                  </div>
                </div>
                {/* RIGHT SIDE PROJECT INFO */}
                <div className="w-[35%] flex flex-1">
                  <Separator className="h-full" orientation="vertical" />
                  <div className="flex flex-col items-center gap-5 pl-4  text-muted-foreground">
                    <h1 className="text-lg font-semibold">
                      Project Info <LucidePen className="w-4 h-4 inline ml-3" />
                    </h1>
                    <p className="text-sm">
                      <span className="text-accent-foreground">
                        Description :{" "}
                      </span>
                      {project.description
                        ? project.description
                        : "Provide a description for your project"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-4 py-1.5 bg-accent/50 hover:bg-accent text-[10px]"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    {/* <div className="text-xs tracking-tight">
                      <p>
                        Created On :{" "}
                        {formatDistanceToNow(project.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                      <p>
                        Updated On :{" "}
                        {formatDistanceToNow(project.updatedAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div> */}
                    <div className="flex justify-between w-full">
                      <p className="text-accent-foreground max-w-[180px] truncate">
                        Owner : {project.repoOwner}
                      </p>
                      <p className="flex items-center gap-1 text-sm">
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-400" />{" "}
                        {project?.projectStars}
                      </p>
                      <p className="flex items-center gap-1 text-sm">
                        <Code className="w-4 h-4 text-blue-500" />{" "}
                        {project?.projectUpvotes}
                      </p>
                      <p className="flex items-center gap-1 text-sm">
                        <GitForkIcon className="w-4 h-4 text-blue-500" />{" "}
                        {project?.projectForks}
                      </p>
                    </div>
                    <Separator className="max-w-[99%] mx-auto my-2" />
                    {/* PROJECT HEALTH SCORE ! */}
                    {project?.healthScore?.totalScore ? (
                      <div className="px-4 flex items-center justify-center gap-10">
                        <p className="text-sm font-medium">
                          <LucideActivity className="w-4 h-4 inline mr-1" />{" "}
                          Project Health Score
                        </p>
                        <p className="text-xl font-semibold">
                          {project.healthScore?.totalScore}
                        </p>
                        {/* Tooltip */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                size="icon-xs"
                                variant="outline"
                                className="text-xs cursor-pointer"
                              >
                                <LucideInfo className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p>
                                  Health scores gives signal to users about the
                                  quality of your project. Higher scores means
                                  More users likely to discover your project.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5">
                        <p>Calculate Health score</p>
                        <Button size="sm" className="text-xs cursor-pointer">
                          <LucideActivity className="w-4 h-4" /> Health Score
                        </Button>
                        {/* Tooltip */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                size="icon-xs"
                                variant="outline"
                                className="text-xs cursor-pointer"
                              >
                                <LucideInfo className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs ">
                                <p>
                                  Health scores gives signal to users about the
                                  quality of your project. Higher scores means
                                  More users likely to discover your project.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                    {/* AI PRO PROMOTION !! */}
                    <div className="bg-linear-to-br from-blue-500/30 to-transparent p-3 max-w-[300px] mx-auto rounded-md">
                      <p className="text-sm font-semibold">
                        Get Better Public Visibility. Rank your project on
                        WeKraft
                      </p>
                      {isPro ? (
                        <Button
                          size="sm"
                          className="text-xs cursor-pointer mt-2"
                        >
                          <LucideBrain className="w-4 h-4" /> Analyze Project
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs cursor-pointer  mt-2"
                        >
                          <LucideExternalLink className="w-4 h-4" /> Unlock Pro
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectSkeleton = () => {
  return (
    <div className="w-full h-full p-6 lg:p-10 space-y-8">
      <Skeleton className="w-40 h-6" />

      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4 w-full max-w-2xl">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="md:col-span-2 h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
};

export default MyProjectId;
