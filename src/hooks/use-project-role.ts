import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useProjectRole(projectId: Id<"projects">) {
  const roleInfo = useQuery(api.projects.getMyProjectRole, { projectId });
  
  return {
    isOwner: roleInfo?.isOwner ?? false,
    isAdmin: roleInfo?.isAdmin ?? false,
    isMember: roleInfo?.isMember ?? false,
    role: roleInfo?.role ?? null,
    isLoading: roleInfo === undefined,
  };
}
