"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LucideExternalLink, LucidePlus } from "lucide-react";
import { toast } from "sonner";

export function CollaboratorAvatars({ inviteLink }: { inviteLink?: string }) {
  const users = useOthers();
  const currentUser = useSelf();

  // Combine others and current user if available
  const allUsers = [...(currentUser ? [currentUser] : []), ...users];

  // Filter those who have valid user info
  const activeUsers = allUsers.filter((u) => u.info);

  return (
    <div className="  scale-75  flex items-center   overflow-hidden z-50 group bg-accent min-w-[200px] px-3 py-1 rounded-full ">
      {inviteLink && (
        <Button
          size="icon-sm"
          variant="outline"
          className="ml-2 cursor-pointer z-50 rounded-full mr-2"
           onClick={async () => {
            await navigator.clipboard.writeText(inviteLink);
            toast.success("Invite link copied!");
          }}
        >
          <LucidePlus className="size-7" />
        </Button>
      )}
      {activeUsers.map((u) => {
        const userInfo = u.info as {
          name: string;
          avatar: string;
          color: string;
        };
        return (
          <div key={u.connectionId} className="">
            <Avatar className="inline-block h-9 w-9  rounded-full ring-2 ring-white bg-white">
              <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
              <AvatarFallback
                style={{ backgroundColor: userInfo.color || "#ccc" }}
              >
                {userInfo.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        );
      })}
    </div>
  );
}
