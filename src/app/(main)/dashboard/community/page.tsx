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
  StarIcon,
  Code,
  GitForkIcon,
  LucideExternalLink,
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
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";

const CommunityPage = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const mode = searchParams.get("mode");
  const { open: sidebarOpen, isMobile } = useSidebar();

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
      <div className={`px-6 py-8`}>
        <div className="flex gap-4">
          <div
            className={`${sidebarOpen ? "w-[300px]" : "w-[345px]"} transition-all duration-300 ease-in-out shrink-0`}
          >
            <CommunityFilters
              searchFilters={searchFilters}
              setSearchFilters={setSearchFilters}
            />
          </div>
          <Separator orientation="vertical" className=" h-screen" />

          <div className="flex w-full">
            <div className="grid grid-cols-2 gap-6 mx-auto">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[370px] h-[300px] rounded-lg dark:bg-muted bg-accent animate-pulse duration-500"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* PARENT DIV (flex layout for desktop) */}
      <div className="flex gap-5">
        {/* Left side: SIDEBAR */}
        <div
          className={`${sidebarOpen ? "w-[300px]" : "w-[345px]"} transition-all duration-300 ease-in-out shrink-0`}
        >
          <CommunityFilters
            searchFilters={searchFilters}
            setSearchFilters={setSearchFilters}
          />
        </div>

        <Separator orientation="vertical" className="" />

        {/* Right side: PROJECTS */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-sm italic tracking-tight text-muted-foreground">
              {query ? `Results for "${query}"` : "Explore Community"}
            </h1>
            <p className="text-lg">
              Discover{" "}
              {mode === "team"
                ? "teams looking for help"
                : mode === "contribute"
                  ? "open source opportunities"
                  : "innovative projects"}{" "}
              ranked by health and activity.
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 ">
              {projects && projects.length > 0 ? (
                projects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    // whileHover={{ y: -5 }}
                  >
                    <Card className="flex flex-col h-[300px] p-0!">
                      <CardHeader className="p-0! ">
                        <div className="h-44 overflow-hidden border rounded-md relative">
                          {project?.thumbnailUrl ? (
                            <Image
                              src={project.thumbnailUrl}
                              alt={project.projectName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Image
                                src="/we-default.png"
                                alt="Placeholder"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="absolute top-0 left-0 w-full h-10 bg-white/5 backdrop-blur-md"></div>

                          <div className=" absolute z-50 top-0 w-full flex justify-between items-start mb-2 py-3 px-5">
                            <Badge
                              variant="secondary"
                              className="bg-primary/90 text-primary-foreground border-none text-[10px]  font-bold"
                            >
                              Recommended
                            </Badge>
                            <div className="flex items-center gap-1 text-primary-foreground font-bold text-xs bg-primary/90 py-0.5 px-3 rounded-lg">
                              <HeartPulse className="h-4 w-4" />
                              {project.healthScore?.totalScore || 0}%
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardFooter className="w-full h-full border-t dark:bg-muted/40 bg-muted -mt-2">
                        <div className="flex flex-col w-full">
                          <div className="flex w-full items-center justify-between">
                            <Link href={`/dashboard/projects/${project._id}`}>
                            <p className="text-xl font-semibold capitalize tracking-tight truncate cursor-pointer">
                            <LucideExternalLink className="w-5 h-5 inline mr-2 -mt-1" />  {project.projectName}
                            </p>
                            </Link>

                            <div className="flex gap-4">
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
                          </div>

                          {project.lookingForMembers ? (
                            project.lookingForMembers.length > 0 && (
                              <div className="mt-4">
                                <div className="flex flex-wrap items-center gap-1">
                                  <Users className="h-3 w-3 inline" />
                                  <span>Looking for:</span>

                                  {/* Show only first 2 roles */}
                                  {project.lookingForMembers
                                    .slice(0, 2)
                                    .map((m: any, idx: number) => (
                                      <span
                                        key={idx}
                                        className="text-[11px] bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full capitalize italic"
                                      >
                                        {m.role}
                                      </span>
                                    ))}

                                  {/* Show +X if more than 2 */}
                                  {project.lookingForMembers.length > 2 && (
                                    <span className="text-[11px] bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full italic">
                                      +{project.lookingForMembers.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          ) : (
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
                          )}
                        </div>
                        {/* <Button
                          variant="default"
                          size="sm"
                          className="flex-1 gap-2 group"
                          onClick={() => window.open(project.repoUrl, "_blank")}
                        >
                          View Repo
                          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Button> */}
                        {/* <div className="flex items-center gap-3 px-2 text-muted-foreground text-[10px]">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{project.projectStars || 0}</span>
                          </div>
                        </div> */}
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
