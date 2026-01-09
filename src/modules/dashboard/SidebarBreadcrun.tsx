"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard" },
  { title: "Marketplace", url: "/dashboard/marketplace" },
  { title: "Notifications", url: "/dashboard/notifications" },
  { title: "Profile", url: "/dashboard/profile" },
  { title: "My Projects", url: "/dashboard/my-projects" },
];

export function DashboardBreadcrumbs() {
  const pathname = usePathname();

  const activeItem = navigationItems
    .filter(
      (item) => pathname === item.url || pathname.startsWith(item.url + "/")
    )
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (!activeItem) return null;

  const isDashboardOnly = activeItem.url === "/dashboard";
  const isWorkspace = pathname.includes("/workspace");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Dashboard */}
        <BreadcrumbItem>
          {isDashboardOnly ? (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Active section (e.g. My Projects) */}
        {!isDashboardOnly && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{activeItem.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Workspace */}
        {isWorkspace && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Workspace</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
