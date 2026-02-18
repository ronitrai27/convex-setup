"use client";
// import {
//   LiveblocksProvider,
//   RoomProvider,
//   ClientSideSuspense,
// } from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

const ProjectCanvas = () => {
  const { user, isLoaded } = useUser();
  const params = useParams();

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Spinner className="size-10" />
        <p className="text-sm text-muted-foreground mt-2">
          Loading Amazing Experience With Looma...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Please sign in
      </div>
    );
  }
};

export default ProjectCanvas
