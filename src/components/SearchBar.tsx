"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Rocket,
  ShoppingBag,
  Users,
  Wrench,
  ChevronDown,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const MODES = [
  {
    id: "projects",
    label: "Discover Projects",
    icon: Rocket,
    placeholders: [
      "AI healthcare projects",
      "Web3 side projects",
      "Full-stack projects in Next.js",
    ],
  },
  {
    id: "team",
    label: "Find Team",
    icon: Users,
    placeholders: [
      "Startup looking for frontend developer",
      "Web3 project needing backend dev",
    ],
  },
  {
    id: "contribute",
    label: "Contribute Open Source",
    icon: Wrench,
    placeholders: [
      "TypeScript projects for beginners",
      "AI open source repositories",
      "Frontend issues needing help",
    ],
  },
];

export function CommunitySearchBar() {
  const [mode, setMode] = useState(MODES[0]);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const ActiveIcon = mode.icon;

  const handleQuery = () => {
    if (!query.trim()) {
      toast.info("Query cant be empty !");
      return;
    }

    // Redirect instantly to community with query and mode
    router.push(`/dashboard/community?query=${encodeURIComponent(query)}&mode=${mode.id}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 rounded-xl  bg-accent/10 dark:bg-accent/50 backdrop-blur-md px-3 py-1 border">
        {/* MODE POPOVER */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 rounded-xl px-4 py-2"
            >
              <ActiveIcon className="h-4 w-4" />
              <span className="text-[11px] font-medium">{mode.label}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[500px] rounded-xl p-4 mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* LEFT: MODE LIST */}
              <div className="space-y-1">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const active = m.id === mode.id;

                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* RIGHT: ICON / VISUAL */}
              <div className="flex items-center justify-center rounded-lg bg-muted/50">
                <motion.div
                  key={mode.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveIcon className="h-16 w-16 text-primary opacity-80" />
                </motion.div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* QUERY INPUT */}
        <div className="relative flex-1 w-[400px] dark:bg-black bg-white overflow-hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={query}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleQuery();
              }
            }}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9 rounded-md focus-visible:ring-0 text-xs "
          />

          {/* TYPED PLACEHOLDER */}
          {query.length === 0 && (
            <div className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              <Typewriter
                words={mode.placeholders}
                loop
                cursor
                cursorStyle="|"
                typeSpeed={60}
                deleteSpeed={40}
                delaySpeed={2000}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
