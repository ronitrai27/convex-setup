"use client";
import React from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { AlertCircle, LucideCross, LucideUser2 } from "lucide-react";
import { Doc, Id } from "../../../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../../../convex/_generated/api";

type Review = Doc<"reviews">;
type Issue = Doc<"issues">;
type Project = Doc<"projects">;

const ActivityFeed = () => {
  const { id } = useParams(); // this contains the id of the project
  const projectId = id as Id<"projects">;
  const project = useQuery(api.projects.getProjectById, {
    projectId: projectId,
  });

  const reviews = useQuery(api.repos.getReviewsByRepoId, {
    repoId: project?.repositoryId!,
  });

  const issues = useQuery(api.repos.getIssuesByRepoId, {
    repoId: project?.repositoryId!,
  });

  // Loading state
  if (reviews === undefined || issues === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Repository Reviews & Issues
          </h1>
          <p className="text-gray-600">Loading data...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-accent rounded"></div>
          <div className="h-32 bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full h-full">
      {project?.projectName}

      <div className="max-w-3xl">
        <h2>Reviews</h2>
        {reviews?.map((review) => (
          <div className="bg-muted p-4">
            <p>review by {review?.authorUserName}</p>
            {review?.authorAvatar && <img src={review?.authorAvatar} alt="" className="w-20 h-20 rounded-full"/>}
            <p>{review.reviewStatus}</p>
            <Message key={review._id} from="assistant">
              <MessageContent>
                <MessageResponse>{review.review}</MessageResponse>
              </MessageContent>
            </Message>
          </div>
        ))}
      </div>

      <div className="max-w-3xl border-t my-5">
        <h2 className="text-xl font-bold">Issues</h2>
        {issues?.map((issue) => (
          <div className="bg-muted p-4">
            <p>Issue Status: {issue?.issueStatus}</p>
            <p>Issue Title: {issue?.issueTitle}</p>
            <p>Issue Type: {issue?.issueType}</p>
            <p>Issue File: {issue?.issueFiles}</p>
            <p>Issue assigned to {issue?.issueAssignedTo || "Unassigned"}</p>

            <Message key={issue._id} from="assistant">
              <MessageContent>
                <MessageResponse>{issue.issueDescription}</MessageResponse>
              </MessageContent>
            </Message>
          </div>
        ))}
      </div>
    </div>

  );
};

export default ActivityFeed;
