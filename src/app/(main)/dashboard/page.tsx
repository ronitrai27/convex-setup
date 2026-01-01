"use client";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";

const DashboardPage = () => {
  return (
    <div>
      <h1>DashboardPage</h1>

      <SignOutButton>
        <Button>Sign Out</Button>
      </SignOutButton>
    </div>
  );
};

export default DashboardPage;
