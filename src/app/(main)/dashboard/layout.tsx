"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-user-store";
import { Loader2 } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "../../../modules/dashboard/SidebarBreadcrun";
import { AppSidebar } from "../../../modules/dashboard/appSidebar";
import { CommunitySearchBar } from "@/components/SearchBar";
import HeaderProfile from "@/components/HeaderProfile";

export default function Layout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
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
  // if (isStoreLoading || user === undefined) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  //     </div>
  //   );
  // }

  return (
    <>
      {/* <AuthLoading>
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLoading> */}

      {/* <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated> */}

      <Authenticated>
        {/* Double check: Ensure we don't flash dashboard content if redirecting */}
        {/* {user && !user.hasCompletedOnboarding ? null : children} */}
        <SidebarProvider defaultOpen={true}>
          {/* <AppSidebar /> */}
             {sidebar}
          <SidebarInset>
            <header className="flex justify-between h-19 py-1 shrink-0 items-center border-b px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 cursor-pointer hover:scale-105 transition-all duration-200" />
                <Separator orientation="vertical" className="mx-4 h-8" />
                <DashboardBreadcrumbs />
              </div>
              <div>
                <CommunitySearchBar />
              </div>
              <div className="">
              <HeaderProfile />
              </div>
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </Authenticated>
    </>
  );
}
