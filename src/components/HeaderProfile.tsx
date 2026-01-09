"use client";
import React from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const HeaderProfile = () => {
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser
  );
  return (
    <div>
      <Avatar className="h-11 w-11">
        <AvatarImage src={user?.imageUrl} />
        <AvatarFallback>UN</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default HeaderProfile;
