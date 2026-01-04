"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2, Folder, Globe, Lock, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function MyProjectsPage() {
  /**
   * LEARNING CONVEX:
   * 1. Data Fetching (Real-time):
   *    We use the `useQuery` hook from `convex/react` to fetch data.
   *    Unlike traditional REST/GraphQL, this hook sets up a WebSocket subscription.
   *    Whenever the data in the database changes, the backend pushes the new data
   *    to the client, and this component automatically re-renders.
   *
   *    Syntax: useQuery(api.folder.file.functionName, args)
   */
  const projects = useQuery(api.projects.getProjects);

  // While data is being fetched properly for the first time, `projects` will be undefined.
  if (projects === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
        <p className="text-muted-foreground">
          Manage and monitor all your connected projects in real-time.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50">
          <div className="rounded-full bg-secondary/30 p-4">
            <Folder className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            You haven't created any projects yet. Go to the onboarding flow to create one.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project._id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl truncate pr-2">{project.projectName}</CardTitle>
                    {/* Visual indicator for Public/Private */}
                    {project.isPublic ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Repository Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 p-2 rounded-md">
                    <GitBranch className="h-4 w-4" />
                    <span className="truncate">{project.repoFullName}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                    <span>Created {formatDistanceToNow(project.createdAt)} ago</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}