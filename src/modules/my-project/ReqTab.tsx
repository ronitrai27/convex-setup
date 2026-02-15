"use client";
import React, { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Ghost, LucideUser2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useProjectRole } from "@/hooks/use-project-role";

const RequestTab = ({ projectId }: { projectId: Id<"projects"> }) => {
  const requests = useQuery(api.projects.getProjectRequests, { projectId });
  //   accept/reject
  const resolveRequest = useMutation(api.projects.resolveJoinRequest);
  //   checking permission per user
  const {
    isAdmin,
    isOwner,
    isMember,
    isPower,
    role,
    isLoading: isRoleLoading,
  } = useProjectRole(projectId);
  // console.log("isPower",isPower);
  // console.log("isAdmin",isAdmin);
  // console.log("isOwner",isOwner);
  // console.log("isMember",isMember);
  console.log("role", role);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResolve = async (
    requestId: Id<"projectJoinRequests">,
    status: "accepted" | "rejected",
  ) => {
    setProcessingId(requestId);
    try {
      await resolveRequest({ requestId, status });
      toast.loading(`Request ${status} successfully`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to process request");
      console.error(error);
    } finally {
      setProcessingId(null);
      toast.dismiss();
    }
  };

  if (requests === undefined || isRoleLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading specific requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-20 text-center border border-dashed dark:border-accent border-accent">
        <Ghost className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No more Pending requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request._id}
          className="flex flex-col p-3 rounded-md border border-white/10 bg-muted "
        >
          <div className="flex justify-between w-full items-start">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={request.userImage} />
                <AvatarFallback>{request.userName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-3">
                <span className="font-semibold truncate max-w-[180px]">{request.userName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full dark:bg-blue-500/10 bg-blue-500/20 text-blue-500 border border-blue-500/20 capitalize">
                  {request.source}
                </span>

                <span className="text-xs bg-primary-foreground py-1.5 px-2 rounded-full flex gap-1">
                  <LucideUser2 className="size-3.5" /> View profile
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Requested{" "}
              {formatDistanceToNow(request.createdAt, { addSuffix: true })}
            </p>
          </div>

          <div className="flex items-center justify-between">
            {request.message && (
              <p className="text-sm text-muted-foreground bg-white/5 p-2 rounded-md mt-1 italic truncate">
                "{request.message}"
              </p>
            )}

            {isPower ? (
              <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                <Button
                  size="sm"
                  variant="destructive"
                  className=" cursor-pointer"
                  onClick={() => handleResolve(request._id, "rejected")}
                  disabled={processingId === request._id}
                >
                  {processingId === request._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  onClick={() => handleResolve(request._id, "accepted")}
                  disabled={processingId === request._id}
                >
                  {processingId === request._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Accept
                </Button>
              </div>
            ) : (
              <p className="text-xs">Members can view only</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestTab;
