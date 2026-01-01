"use client";

import { cn } from "@/lib/utils";
import { Github, Check, Loader2, LucideGitBranch, LucideExternalLink, Star } from "lucide-react";
import { useRepositories } from "./repo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
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
  const { data: repositories, isLoading, error } = useRepositories(1, 10);

  const handleRepoClick = (repo: Repository) => {
    setSelectedRepo(repo.name);
    toast.success(`Repository: ${repo.name}`, {
      description: `ID: ${repo.id}`,
    });
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
      repo.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="space-y-5 max-h-55 overflow-y-auto pr-2 no-scrollbar">
      {filteredRepos.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No repositories found
        </p>
      ) : (
        filteredRepos.map((repo) => (
          <div
            key={repo.id}
            onClick={() => handleRepoClick(repo)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group",
              selectedRepo === repo.name
                ? "bg-white text-black border-white"
                : "bg-white/5 text-white border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
            )}
          >
            <div className="flex w-full justify-between">
              <div className="flex items-center gap-3">
                <LucideGitBranch
                  className={cn(
                    "w-5 h-5",
                    selectedRepo === repo.name
                      ? "text-black"
                      : "text-muted-foreground"
                  )}
                />
                <div className="flex items-center gap-2 ">
                  <p className="font-medium block capitalize text-sm">{repo.name}</p>
                  <Link href={repo.html_url} target="_blank" ><LucideExternalLink className="w-4 h-4" /></Link>
                </div>
              </div>
              <Badge variant="outline" className="text-xs"><Star className="w-4 h-4" />{repo.stargazers_count}</Badge>
            </div>

            {/* {selectedRepo === repo.name && <Check className="w-4 h-4" />} */}
          </div>
        ))
      )}
    </div>
  );
}
