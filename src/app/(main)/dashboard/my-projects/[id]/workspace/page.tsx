"use client"
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../../convex/_generated/dataModel";


const ProjectWorkspace = () => {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  return (
    <div className=" w-full p-6">
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
    </div>
  );
};

export default ProjectWorkspace;
