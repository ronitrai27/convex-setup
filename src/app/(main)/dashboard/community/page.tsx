"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Rocket,
  Star,
  Users,
  ExternalLink,
  HeartPulse,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { CommunityFilters } from "@/components/CommunityFilters";

const CommunityPage = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const mode = searchParams.get("mode");

  const [aiLoading, setAiLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<{
    tags?: string[];
    roles?: string[];
  }>({});

  // Convex query automatically re-runs when searchFilters changes
  const projects = useQuery(api.projects.searchAndRank, searchFilters);

  useEffect(() => {
    const triggerAISearch = async () => {
      if (!query || !mode) return;

      setAiLoading(true);
      try {
        const res = await fetch(
          `/api/ai/search?query=${encodeURIComponent(query)}&mode=${mode}`,
        );
        if (!res.ok) throw new Error("AI search failed");

        const data = await res.json();
        // Update filters to trigger Convex query
        setSearchFilters({
          tags: data.tags,
          roles: data.roles,
        });
      } catch (error) {
        console.error("AI Research Error:", error);
      } finally {
        setAiLoading(false);
      }
    };

    triggerAISearch();
  }, [query, mode]);

  const isLoading = aiLoading || projects === undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse italic opacity-50">Analyzing avec AI...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 space-y-2">
        {/* <h1 className="text-xl">
          {query ? `Results for "${query}"` : "Explore Community"}
        </h1> */}
        <p className="text-sm">
          Discover{" "}
          {mode === "team"
            ? "teams looking for help"
            : mode === "contribute"
              ? "open source opportunities"
              : "innovative projects"}{" "}
          ranked by health and activity.
        </p>
      </div>

      {/* PARENT DIV (flex layout for desktop) */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left side: SIDEBAR */}
        <div className="w-full lg:w-1/4 shrink-0">
          <CommunityFilters 
            searchFilters={searchFilters} 
            setSearchFilters={setSearchFilters} 
          />
        </div>

        {/* Right side: PROJECTS */}
        <div className="flex-1">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
              {projects && projects.length > 0 ? (
                projects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider font-bold"
                          >
                            {project.tags[0] || "General"}
                          </Badge>
                          <div className="flex items-center gap-1 text-green-500 font-bold text-xs">
                            <HeartPulse className="h-3 w-3" />
                            {project.healthScore?.totalScore || 0}%
                          </div>
                        </div>
                        <CardTitle className="line-clamp-1">
                          {project.projectName}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 h-10 italic font-thin text-xs opacity-70">
                          {project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grow">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tags.slice(0, 3).map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] opacity-70 italic font-thin"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        {project.lookingForMembers &&
                          project.lookingForMembers.length > 0 && (
                            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-muted/50">
                              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>Looking for:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {project.lookingForMembers.map(
                                  (m: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full capitalize font-thin italic"
                                    >
                                      {m.role}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </CardContent>
                      <CardFooter className="flex gap-2 pt-4 border-t bg-muted/10">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 gap-2 group"
                          onClick={() => window.open(project.repoUrl, "_blank")}
                        >
                          View Repo
                          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Button>
                        <div className="flex items-center gap-3 px-2 text-muted-foreground text-[10px]">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{project.projectStars || 0}</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-muted">
                    <Rocket className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold italic opacity-40">
                    No projects found matching your search.
                  </h3>
                  <p className="text-muted-foreground italic font-thin">
                    Try adjusting your query or filters.
                  </p>
                </div>
              )}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
