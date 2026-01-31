"use client";
import React, { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useProjectRole } from "@/hooks/use-project-role";

const RequestTab = ({ projectId }: { projectId: Id<"projects"> }) => {
  const requests = useQuery(api.projects.getProjectRequests, { projectId });
  //   accept/reject
  const resolveRequest = useMutation(api.projects.resolveJoinRequest);
  //   checking permission per user
  const { isAdmin,isOwner,isMember, isLoading: isRoleLoading } = useProjectRole(projectId);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleResolve = async (
    requestId: Id<"projectJoinRequests">,
    status: "accepted" | "rejected",
  ) => {
    setProcessingId(requestId);
    try {
      await resolveRequest({ requestId, status });
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      toast.error("Failed to process request");
      console.error(error);
    } finally {
      setProcessingId(null);
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
      <div className="p-8 text-center border border-dashed dark:border-accent border-gray-200">
        <p className="text-muted-foreground">No pending join requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request._id}
          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-white/10 bg-black/20 gap-4"
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border border-white/10">
              <AvatarImage src={request.userImage} />
              <AvatarFallback>{request.userName[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {request.userName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                  {request.source}
                </span>
              </div>

              {request.message && (
                <p className="text-sm text-gray-300 bg-white/5 p-2 rounded-md mt-1 italic">
                  "{request.message}"
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Requested{" "}
                {formatDistanceToNow(request.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>

          {isAdmin || isOwner && (
            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 md:flex-none border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-red-500 cursor-pointer"
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
          )}
        </div>
      ))}
    </div>
  );
};

export default RequestTab;
