"use client";

import { useParams } from "next/navigation";
import React, { useState } from "react";
import { useQuery } from "convex/react";
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
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import StatsTab from "@/modules/my-project/Stats";
import Image from "next/image";

const MyProjectId = () => {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  // Fetch project details
  const project = useQuery(api.projects.getProjectById, { projectId });

  const [activeTab, setActiveTab] = useState("home");
  const [homeTab, setHomeTab] = useState("feed");
  if (project === undefined) {
    return <ProjectSkeleton />;
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/dashboard">
          <Button variant="default">Go Back Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-full animate-in fade-in duration-700 ">
      {/* Header Section */}
      <div className="flex flex-col gap-5">
        {activeTab === "home" && (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        )}
        {/* =========================== */}
        {/* TABS */}
        {/* =========================== */}
        <div className="">
          {/* Tab Header */}
          <div className="flex gap-6 px-10 mb-10">
            <Button
              size="sm"
              className="px-10"
              variant={activeTab === "home" ? "default" : "outline"}
              onClick={() => setActiveTab("home")}
            >
              Home
            </Button>
            <Button
              size="sm"
              className="px-10"
              variant={activeTab === "workspace" ? "default" : "outline"}
              onClick={() => setActiveTab("workspace")}
            >
              Workspace
            </Button>
            <Button
              size="sm"
              className="px-10"
              variant={activeTab === "actions" ? "default" : "outline"}
              onClick={() => setActiveTab("actions")}
            >
              Actions
            </Button>
          </div>
          {/* <Separator className="max-w-[80%] mx-auto my-5" /> */}

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
              <div className="w-[1064px] h-[240px] mx-auto bg-primary/10 rounded-lg overflow-hidden mb-10"></div>

              {/* PARENT CONTAINER LEFT SIDE TABS || RIGHT SIDE PROJECT INFO */}
              <div className="flex">
                {/* LEFT SIDE 3 TABS */}
                <div className="w-[70%]">
                  {/* TABS */}
                  <div className="flex gap-6  px-4">
                    <Button
                      size="sm"
                      className="rounded-full px-5 text-[10px]"
                      variant={homeTab === "feed" ? "default" : "outline"}
                      onClick={() => setHomeTab("feed")}
                    >
                      Feed
                    </Button>
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
                      variant={homeTab === "requests" ? "default" : "outline"}
                      onClick={() => setHomeTab("requests")}
                    >
                      Requests
                    </Button>
                  </div>
                  <Separator className="max-w-[99%] mx-auto my-5" />

                  {/* TAB CONTENT */}
                  <div className="px-6">
                    {/* {homeTab === "feed" && <FeedTab />} */}
                    {homeTab === "stats" && (
                      <StatsTab
                        repoName={project.repoName}
                        repoOwner={project.repoOwner}
                      />
                    )}
                    {/* {homeTab === "requests" && <RequestsTab />} */}
                  </div>
                </div>
                {/* RIGHT SIDE PROJECT INFO */}
                <div className="w-[30%] flex">
                  <Separator className="h-full" orientation="vertical" />
                  <div className="flex flex-col items-center gap-5 px-4 text-muted-foreground">
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
                          className="px-4 py-1.5 bg-accent/50 hover:bg-accent text-xs"
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
                      <p className="text-accent-foreground">
                        Owner : {project.repoOwner}
                      </p>
                      <p className="flex items-center gap-1 text-sm">
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-400" />{" "}
                        10
                      </p>
                      <p className="flex items-center gap-1 text-sm">
                        <Code className="w-4 h-4 text-blue-500" /> 100
                      </p>
                    </div>
                    <Separator className="max-w-[99%] mx-auto my-5" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB ACTIONS */}
          {activeTab === "actions" && (
            <div className="">
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

              {/* ACTIONS 3 AGENTS */}
              <h2 className="text-lg font-semibold">Agent & Intelligence</h2>
              <div className="grid grid-cols-3 gap-10 my-6">
                <Card className="bg-linear-to-br from-blue-500/30 via-indigo-500/5 to-transparent py-3 scale-95 hover:scale-100 transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <CardTitle>
                      <LucideBrain className="w-4 h-4 inline mr-2" /> Repo
                      Intelligence Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="">
                      <div>
                        <p>Chat with your repository like a senior engineer.</p>
                        <p className="text-muted-foreground text-sm">
                          Understands codebase, Explains flows, logic, and
                          dependencies Visualizes architecture in real time
                        </p>
                      </div>
                      <Image
                        src="/6.png"
                        alt="Repo Intelligence Agent"
                        width={120}
                        height={120}
                        className="object-contain mx-auto opacity-70"
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* 2 */}
                <Card className="bg-linear-to-br from-blue-500/30 via-indigo-500/5 to-transparent py-3 scale-95 hover:scale-100 transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <CardTitle>
                      <LucideBrain className="w-4 h-4 inline mr-2" />
                      Architecture & ER Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="">
                      <div>
                        <p>Turn code into clear system diagrams.</p>
                        <p className="text-muted-foreground text-sm">
                          Generates ER diagrams Creates system & data flow
                          diagrams Explains relationships visually
                        </p>
                      </div>
                      <Image
                        src="/5.png"
                        alt="Repo Intelligence Agent"
                        width={120}
                        height={120}
                        className="object-contain mx-auto opacity-70"
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* 3 */}
                <Card className="bg-linear-to-br from-blue-500/30 via-indigo-500/5 to-transparent py-3 scale-95 hover:scale-100 transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <CardTitle>
                      <LucideBrain className="w-4 h-4 inline mr-2" />
                      Auto Documentation Agent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="">
                      <div>
                        <p>Your repo, always documented.</p>
                        <p className="text-muted-foreground text-sm">
                          Auto-generates README & docs Explains APIs & modules
                          Keeps docs in sync with code
                        </p>
                      </div>
                      <Image
                        src="/7.png"
                        alt="Auto Documentation Agent"
                        width={120}
                        height={120}
                        className="object-contain mx-auto opacity-70"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
