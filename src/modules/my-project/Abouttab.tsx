"use client";

import React, { useState } from "react";
import { useMutation as useConvexMutation } from "convex/react";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Github,
  Sparkles,
  FileText,
  Edit,
  Save,
  X,
  Loader2,
  Brain,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReadme } from "@/modules/github/action";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const AboutTab = ({ project, isPro }: { project: any; isPro: boolean }) => {
  const updateAbout = useConvexMutation(api.projects.updateAbout);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(project?.about || "");

  const { mutate: fetchReadmeAction, isPending: isFetching } =
    useTanstackMutation({
      mutationFn: async () => {
        const readme = await getReadme(project.repoOwner, project.repoName);
        if (!readme)
          throw new Error("Could not find a README in the repository.");
        return readme;
      },
      onSuccess: async (readme) => {
        await updateAbout({
          projectId: project._id,
          about: readme,
        });
        setEditContent(readme);
        toast.success("README fetched and saved successfully!");
      },
      onError: (error: any) => {
        console.error(error);
        toast.error(error.message || "Failed to fetch README.");
      },
    });

  const { mutate: saveContentAction, isPending: isSaving } =
    useTanstackMutation({
      mutationFn: async (content: string) => {
        await updateAbout({
          projectId: project._id,
          about: content,
        });
      },
      onSuccess: () => {
        setIsEditing(false);
        toast.success("About content updated successfully!");
      },
      onError: () => {
        toast.error("Failed to update about content.");
      },
    });

  const handleFetchReadme = () => fetchReadmeAction();
  const handleSave = () => saveContentAction(editContent);

  if (isEditing) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold ">
                Edit About Content
              </CardTitle>
              <CardDescription>
                Modify your project's description using Markdown.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Write about your project here..."
            className="min-h-[500px] font-mono text-sm bg-secondary/20 border-primary/10 focus-visible:ring-primary/20"
          />
        </CardContent>
      </Card>
    );
  }

  if (!project.about) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 bg-secondary/10 rounded-2xl border-2 border-dashed border-primary/20">
        <div className="p-4 bg-primary/10 rounded-full">
          <FileText className="w-12 h-12 text-primary" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-bold">No About Page Yet</h3>
          <p className="text-muted-foreground">
            Make your project stand out by adding a detailed description. You
            can fetch it from your GitHub README or generate one using AI.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={handleFetchReadme}
            disabled={isFetching}
            size="sm"
            variant="default"
            className="text-xs cursor-pointer hover:scale-105 transition-all duration-300"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Github className="w-4 h-4 mr-2" />
            )}
            Fetch README from Repo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/5 transition-all duration-300"
            onClick={() => toast.info("AI Generation feature coming soon!")}
          >
            <Brain className="w-4 h-4 mr-2 text-blue-600" />
            Generate Doc from AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-3 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold ">About Project</CardTitle>
            <CardDescription>
              A detailed overview of {project.projectName}
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditContent(project.about);
                setIsEditing(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditContent(project.about);
                setIsEditing(true);
              }}
            >
              <Brain className="w-4 h-4 mr-2 text-blue-600" />
              Generate with AI
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFetchReadme}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Github className="w-4 h-4 mr-2" />
              )}
              Update from GitHub
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-6">
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-primary prose-a:text-blue-400 prose-code:bg-primary/10 prose-code:p-1 prose-code:rounded prose-pre:bg-secondary/30 prose-pre:border prose-pre:border-primary/10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {project.about}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutTab;
