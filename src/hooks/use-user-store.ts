import { useUser } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// =============================================================
/**
 * 🔒 useStoreUser Hook
 *
 * Importance & Purpose:
 * This hook acts as a critical bridge between Clerk (Auth) and Convex (Database).
 * Even if a user is authenticated with Clerk, they might not exist in your Convex database yet.
 *
 * What it does:
 * 1. SYNC: Automatically ensures the current authenticated user exists in the "users" table.
 * 2. CREATE/UPDATE: Calls the `api.users.store` mutation which creates the user if new,
 *    or updates them if they already exist.
 * 3. STATE MANAGEMENT: Returns `isLoading` as TRUE until the user is confirmed to be
 *    persisted in the database. This prevents the UI from trying to fetch user data
 *    before the user record is actually ready.
 */
export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { isLoaded: isClerkLoaded } = useUser();

  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (!isAuthenticated || !isClerkLoaded) return;
    if (userId) return; //  already stored

    let cancelled = false;

    async function createUser() {
      try {
        const id = await storeUser();
        if (!cancelled) {
          setUserId(id);
        }
      } catch (err) {
        console.error("[useStoreUser] store failed", err);
      }
    }

    createUser();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isClerkLoaded, storeUser, userId]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
