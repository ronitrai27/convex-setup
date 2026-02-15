"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Orb } from "@/components/elevenLabs/Orb";
import DialogOrb from "./_components/DialogOrb";

const ProjectWorkspace = () => {
  const params = useParams();
  const projectId = params.id as Id<"projects">;
  const repoId = params.repoId as Id<"repositories">;
  const [isOrbOpen, setIsOrbOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-72px)] w-full p-6 relative">
      <main>
        <Link href={`/dashboard/my-projects/${projectId}`}>
          <Button className="text-xs cursor-pointer" variant="ghost" size="sm">
            <ChevronLeft />
            Back to Home
          </Button>
        </Link>
        <h1>DEDICATED PROJECT WORKSPACE</h1>
        <p>Check here who joins and who leaves</p>
        <p>check here recent pr / fork / commit made by who ?</p>
        <p>
          visit to-do , time-tracker, Activity(where all commits/ pr /issue with
          tags created and solved, etc), Whiteboard(for team ideation , sketches
          and brainstorming), Code generator(from to-do/sketch to code with live
          preview.) and Actions ( repo visulaizer, schema visualizer,
          Architecture visualizer.){" "}
        </p>
      </main>

      {/* Orb Button  */}
      <Button
        onClick={() => setIsOrbOpen(true)}
        className="absolute bottom-10 right-6 cursor-pointer p-0! rounded-full "
        variant={"ghost"}
      >
        <div className="bg-muted relative h-15 w-15 rounded-full   shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
            <Orb
              colors={["#CADCFC", "#A0B9D1"]}
              seed={1000}
              agentState={null}
            />
          </div>
        </div>
      </Button>

      <DialogOrb isOrbOpen={isOrbOpen} setIsOrbOpen={setIsOrbOpen} repoId={repoId} />
    </div>
  );
};

export default ProjectWorkspace;
