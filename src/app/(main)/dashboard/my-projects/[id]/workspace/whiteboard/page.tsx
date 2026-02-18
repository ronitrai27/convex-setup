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
import { Typewriter } from "react-simple-typewriter";

const placeholders = [
  "Preparing your workspace...",
  "Calibrating intelligence...",
  "Loading collaborative engine...",
  "Activating smart canvas...",
];

const ProjectCanvas = () => {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  if (!isLoaded) {
    return (
      <div className="h-[calc(100vh-70px)] w-full flex flex-col gap-4 items-center justify-center">
        <Spinner className="size-10" />
        <div className="text-lg flex items-center">
          <Typewriter
            words={placeholders}
            loop
            cursor
            cursorStyle="|"
            typeSpeed={60}
            deleteSpeed={40}
            delaySpeed={2000}
          />
        </div>
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
            <div className="h-[calc(100vh-70px)] w-full flex flex-col gap-4 items-center justify-center">
              <Spinner className="size-10" />
              <div className="text-lg flex items-center">
                <Typewriter
                  words={placeholders}
                  loop
                  cursor
                  cursorStyle="|"
                  typeSpeed={60}
                  deleteSpeed={40}
                  delaySpeed={2000}
                />
              </div>
            </div>
          }
        >
          <Canvas />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};

export default ProjectCanvas;
