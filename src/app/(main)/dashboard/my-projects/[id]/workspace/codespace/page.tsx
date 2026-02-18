"use client";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { Code, LucideExternalLink, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../../../convex/_generated/api";

const getShell = (code: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://kit.fontawesome.com/your-font-awesome-kit.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js"></script>
    <style>
      body { margin: 0; padding: 0; min-height: 100vh; }
    </style>
</head>
<body class="bg-gray-50">
${code}
</body>
</html>
`;

const Codespace = () => {
  const param = useParams();
  const projectId = param.id as Id<"projects">;
  const allCodes = useQuery(api.codespace.getCodespaces, { projectId });
  return (
    <div className="p-6">
      <div className="flex items-start justify-between ">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-semibold">
            Codespace <Code className="size-6 ml-2 inline" />
          </h1>
          <p className="text-base text-muted-foreground">
            Manage your all generated codes here
          </p>
        </div>

        <Link href={`/dashboard/my-projects/${projectId}/workspace/codespace/generate`}>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600 text-xs cursor-pointer"
            size="sm"
          >
            Generate New <LucideExternalLink />
          </Button>
        </Link>
      </div>
      {allCodes === undefined ? (
        <div className="flex items-center justify-center p-20">
          <Spinner className="size-10" />
        </div>
      ) : allCodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {allCodes.map((code) => (
            <div
              key={code._id}
              className="group border border-border/50 rounded-xl p-5 bg-card/50 hover:bg-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-5">
                  <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Code className="size-4" />
                  </div>
                  <h2 className="font-semibold text-xl capitalize">
                    {code?.codespaceName}
                  </h2>
                </div>
                <div className="space-y-1">
                  <div className="bg-primary/10 rounded-md p-3 max-h-40 overflow-hidden relative">
                    <iframe
                      key={code._id}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                      srcDoc={getShell(code.code || "")}
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-muted/80 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <Button variant="outline" size="sm" className="text-xs">
                  View Code <LucideExternalLink />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[350px] border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted mt-10 p-10 text-center animate-in fade-in zoom-in duration-700">
          <div className="relative mb-6">
            <div className="relative size-16 bg-primary-foreground border rounded-lg flex items-center justify-center shadow-inner">
              <Code className="size-8 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-3">
            No Generated Code Yet
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm text-balance text-sm">
            Your codespace is currently empty. Bring your ideas to life by
            generating your first component with our AI agent.
          </p>

          <Link href={`/dashboard/my-projects/${projectId}/workspace/codespace/generate`}>
            <Button className="cursor-pointer">
              Generate Now
              <Sparkles className="size-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Codespace;
