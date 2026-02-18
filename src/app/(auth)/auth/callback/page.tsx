"use client";

import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-user-store";
import { Loader2 } from "lucide-react";
import { getGithubAccessToken, getUserTopLanguages } from "@/modules/github/action";
import { toast } from "sonner";

// Here's a summary of the approach:

// Sync User: It uses your 
// useStoreUser
//  hook to ensure the user is authenticated and synced to your Convex database.
// Fetch User: It uses useQuery(api.users.getCurrentUser) to get the full user profile including hasCompletedOnboarding.
// Redirect:
// If hasCompletedOnboarding is true -> Redirects to /dashboard.
// Otherwise -> Redirects to /onboard/[userid].
// If not authenticated -> Redirects to /.
// The code relies on 
// useStoreUser
//  to handle the initial syncing logic (creating the user if they don't exist).
const AuthCallback = () => {
  const { isAuthenticated, isLoading: isStoreLoading } = useStoreUser();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);

  // const setGithubToken = useMutation(api.users.setGithubToken);
  const updateUserSkills = useMutation(api.users.updateUserSkills);

  useEffect(() => {
    // 1. Wait for syncing to finish
    if (isStoreLoading) return;

    // 2. If not authenticated after loading, redirect to home
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // 3. Once stored, check user data
    // user === undefined means loading, null means not found (shouldn't happen if stored)
    if (user === undefined) return;

    // 4. GET AND SAVE GITHUB TOKEN
    // We do this concurrently or before redirect
    // const syncGithubToken = async () => {
    //   try {
    //     const token = await getGithubAccessToken();
    //     if (token) {
    //       await setGithubToken({ token });
    //       console.log("✅ GitHub Access Token stored securely.");
    //       toast.info("Access To Github Granted Successfully.")
    //     } else {
    //       console.warn("⚠️ No GitHub Access Token found.");
    //       toast.error("No GitHub Access Token found.");
    //     }
    //   } catch (error) {
    //     console.error("❌ Failed to sync GitHub token", error);
    //     toast.error("Failed to sync GitHub token");
    //   }
    // };

    // Now we will fire getUserTopLanguages !
    // getUserTopLanguages()

    // Run this async without blocking (or await it if critical)
    // We'll let it run and then redirect. 
    // Ideally we might want to await it, but for speed we fire-and-forget 
    // or wait for it if onboarding depends on it.
    // Given the request "identify when to call it before onbaording starts",
    // we should wait for it.
    
    const handleRedirect = async () => {
      // await syncGithubToken(); 

      // IF USER SKILLS ARE ALREADY PRESENT, JUST REDIRECT
      if (user && user.skills && user.skills.length > 0) {
        console.log("✅ User skills already present, redirecting...");
        if (user.hasCompletedOnboarding) {
          router.push("/dashboard");
        } else {
          router.push(`/onboard/${user._id}`);
        }
        return;
      }

      // OTHERWISE, FETCH TOP LANGUAGES AND UPDATE
      try {
        if (user && user.githubUsername) {
          console.log("🔍 Fetching top languages for user...");
          const topLanguages = await getUserTopLanguages(user.githubUsername);
          if (topLanguages && topLanguages.length > 0) {
            await updateUserSkills({ skills: topLanguages });
            console.log("✅ Top languages updated as skills.");
            toast.success("Github User Profile Synced Successfully.");
          }
        }
      } catch (error) {
        console.error("❌ Failed to update user skills:", error);
        toast.error("Failed to update user skills");
      }

      if (user && user.hasCompletedOnboarding) {
        router.push("/dashboard");
      } else if (user) {
        router.push(`/onboard/${user._id}`);
      }
    };

    handleRedirect();

  }, [isAuthenticated, isStoreLoading, user, router, updateUserSkills]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Connecting to Github...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
