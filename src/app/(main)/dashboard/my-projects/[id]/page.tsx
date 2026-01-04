"use client";

import { useParams } from "next/navigation";
import React from "react";
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
import { ArrowLeft, Github, Globe, Lock, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const MyProjectId = () => {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  // Fetch project details
  const project = useQuery(api.projects.getProjectById, { projectId });

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
    <div className="w-full h-full p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
              {project.projectName}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {project.isPublic ? (
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
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
            
            <Link href={project.repoUrl} target="_blank">
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Github className="w-4 h-4" /> View Repository
              </Button>
            </Link>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-4 py-1.5 bg-accent/50 hover:bg-accent text-sm"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="md:col-span-2 border-primary/10 bg-linear-to-br from-card to-card/50 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5 text-primary" />
                    Repository Details
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                    <p className="text-lg font-semibold">{project.repoFullName}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Owner</span>
                    <p className="text-lg font-semibold">{project.repoOwner}</p>
                 </div>
                 <div className="space-y-1 sm:col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">URL</span>
                    <Link href={project.repoUrl} target="_blank" className="flex items-center gap-1 text-primary hover:underline group">
                         {project.repoUrl}
                         <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                 </div>
            </CardContent>
        </Card>

        {/* Sidebar / Meta Info */}
        <Card className="border-primary/10 bg-linear-to-br from-card to-card/50 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Project Info
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                    <p className="font-medium">
                        {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                    </p>
                </div>
                 <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                    <p className="font-medium">
                        {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                    </p>
                </div>
            </CardContent>
        </Card>
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
