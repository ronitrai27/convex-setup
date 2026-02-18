"use client";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import Canvas from "./canvas";

const ProjectCanvas = () => {
    const { user, isLoaded } = useUser();
  const params = useParams();
  const projectId = params.id as Id<"projects">;



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

   return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={projectId}
        initialPresence={{
          cursor: {
            x: 0,
            y: 0,
          },
        }}
      >
        <ClientSideSuspense
          fallback={
            <div className="h-full w-full flex flex-col items-center justify-center">
              <Spinner className="size-10" />
              <p className="text-sm text-muted-foreground mt-2">
                Loading Amazing Experience With Looma...
              </p>
            </div>
          }
        >
          <Canvas />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};

export default ProjectCanvas
