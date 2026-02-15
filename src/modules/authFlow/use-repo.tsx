"use client";

import { cn } from "@/lib/utils";
import {
  Github,
  Check,
  Loader2,
  LucideGitBranch,
  LucideExternalLink,
  Star,
  GitFork,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRepositories } from "./repo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { createWebhook } from "../github/action";
import { ConnectRepo } from ".";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  owner: {
    login: string;
  };
}

interface RepositoryListProps {
  searchQuery: string;
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
}

export function RepositoryList({
  searchQuery,
  selectedRepo,
  setSelectedRepo,
}: RepositoryListProps) {
  const [page, setPage] = useState(1);
  const { data: repositories, isLoading, error } = useRepositories(page, 10);
  const createRepo = useMutation(api.repos.createRepository);
  const storedRepo = useQuery(api.repos.getRepository);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleRepoClick = (repo: Repository) => {
    setSelectedRepo(repo.name);
  };

  const handleConnect = async (e: React.MouseEvent, repo: Repository) => {
    e.stopPropagation(); // Prevent row click
    if (storedRepo) {
      toast.error("You can already have a connected repository.");
      return;
    }
    const toastId = toast.loading(`Connecting ${repo.name}...`);
    setIsConnecting(true);
    try {
      // first connect webhook ! if success then save in db
      // Create Webhook
      await createWebhook(repo.owner.login, repo.name);
      await createRepo({
        githubId: BigInt(repo.id),
        name: repo.name,
        owner: repo.owner.login,
        fullName: repo.full_name,
        url: repo.html_url,
      });

      toast.success(`Repository ${repo.name} connected successfully!`, {
        id: toastId,
      });

      // Trigger background indexing
      // triggerRepoIndexing(repo.owner.login, repo.name);
      ConnectRepo({ owner: repo.owner.login, repo: repo.name });
      console.log("Repository triggered for Indexing.....!");
      // toast.success("Indexing started!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to connect repository");
      toast.dismiss(toastId);
    } finally {
      setIsConnecting(false);
      // toast.dismiss(toastId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg">
        Failed to load repositories. Please try again.
      </div>
    );
  }

  const filteredRepos =
    repositories?.filter((repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-55 overflow-y-auto pr-2 no-scrollbar">
        {filteredRepos.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No repositories found
          </p>
        ) : (
          filteredRepos.map((repo) => {
            const isConnected = storedRepo?.githubId === BigInt(repo.id);
            const isOtherConnected = !!storedRepo && !isConnected;

            return (
              <div
                key={repo.id}
                onClick={() => handleRepoClick(repo)}
                className={cn(
                  "w-full flex flex-col space-y-2 items-center justify-between p-2.5 rounded-xl border transition-all duration-200 group",
                  selectedRepo === repo.name
                    ? "bg-white/20 text-white border-white"
                    : "bg-white/10 text-white border-white/5 hover:border-white/20 hover:bg-white/[0.07]",
                  isConnected && "border-green-500/50 bg-green-500/10",
                )}
              >
                <div className="flex w-full justify-between">
                  <div className="flex items-center gap-3">
                    <LucideGitBranch
                      className={cn(
                        "w-5 h-5",
                        selectedRepo === repo.name
                          ? "text-white"
                          : "text-muted-foreground",
                      )}
                    />
                    <div className="flex items-center gap-2 ">
                      <p className="font-medium block capitalize text-sm">
                        {repo.name}
                      </p>
                      <Link href={repo.html_url} target="_blank">
                        <LucideExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs border-accent-foreground/10"
                  >
                    <Star className="w-4 h-4" />
                    {repo.stargazers_count}
                  </Badge>
                </div>

                {isConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit text-[10px] mr-auto ml-5 text-green-400 hover:text-green-300 pointer-events-none gap-1"
                  >
                    <Check className="w-3 h-3" /> Connected
                  </Button>
                ) : (
                  <Button
                    disabled={isOtherConnected || isConnecting}
                    variant={selectedRepo === repo.name ? "default" : "outline"}
                    size="sm"
                    className="w-fit cursor-pointer text-[10px] mr-auto ml-5"
                    onClick={(e) => handleConnect(e, repo)}
                  >
                    {isConnecting && selectedRepo === repo.name ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    {isOtherConnected ? "Connect " : "Connect"}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || isLoading}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="text-[10px] h-7 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          Back
        </Button>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Page {page}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!repositories || repositories.length < 10 || isLoading}
          onClick={() => setPage((prev) => prev + 1)}
          className="text-[10px] h-7 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
        >
          Next
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
