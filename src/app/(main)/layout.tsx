"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-user-store";
import { Loader2 } from "lucide-react";
import { RedirectToSignIn } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: isStoreLoading } = useStoreUser();
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    // 1. Wait for syncing to finish
    if (isStoreLoading) return;

    // 2. Wait for user data fetch
    if (user === undefined) return;

    // 3. Security Check: Onboarding
    // If user exists but hasn't completed onboarding, FORCE redirect.
    if (user && !user.hasCompletedOnboarding) {
      router.push(`/onboard/${user._id}`);
    }
  }, [isStoreLoading, user, router]);

  // Global Loading State (Syncing or Fetching User)
  if (isStoreLoading || user === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <AuthLoading>
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>

      <Authenticated>
         {/* Double check: Ensure we don't flash dashboard content if redirecting */}
        {user && !user.hasCompletedOnboarding ? null : children}
      </Authenticated>
    </>
  );
}
