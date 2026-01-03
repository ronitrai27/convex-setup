"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeButtons() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        onClick={() => setTheme("light")}
        className="flex w-full items-center gap-3 justify-start"
      >
        <Sun className="h-4 w-4" />
        Light Mode
      </Button>

      <Button
        variant={theme === "dark" ? "default" : "outline"}
        onClick={() => setTheme("dark")}
        className="flex w-full items-center gap-3 justify-start"
      >
        <Moon className="h-4 w-4" />
        Dark Mode
      </Button>
    </div>
  );
}
