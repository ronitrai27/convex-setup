"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import RepoVisualizer from "@/modules/visualize/Store";
import { LuLayers2, LuLayers3 } from "react-icons/lu";

const RepoPage = () => {
  const { id } = useParams(); // this contains the id of the project
  const projectId = id as Id<"projects">;
  const project = useQuery(api.projects.getProjectById, {
    projectId: projectId,
  });

  const repoOwner = project?.repoOwner;
  const repoName = project?.repoName;

  return (
    <div className="flex-1 w-full h-full p-6">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Repo Tree Visualizer <LuLayers3 className="inline ml-2" size={24}/></h1>
            <p className="text-muted-foreground text-sm">
              Explore the Structure and risk heatmap of {repoOwner}/{repoName}
            </p>
          </div>

          <div>
            <p className="text-sm mb-1">Risk Heatmaps</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <p className="text-xs ml-2">High Risks</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <p className="text-xs ml-2">Bottlenecks</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-700"></div>
              <p className="text-xs ml-2">Normal</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          {repoOwner && repoName ? (
            <RepoVisualizer owner={repoOwner} repo={repoName} />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed">
              <div className="flex flex-col items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/2 animate-shimmer bg-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Fetching repository structure...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoPage;

