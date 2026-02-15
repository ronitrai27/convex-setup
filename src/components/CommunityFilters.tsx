"use client";

import React, { useState } from "react";
import { AVAILABLE_TAGS, roles as AVAILABLE_ROLES } from "@/components/Universal-static-storage";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface CommunityFiltersProps {
  searchFilters: {
    tags?: string[];
    roles?: string[];
  };
  setSearchFilters: React.Dispatch<React.SetStateAction<{
    tags?: string[];
    roles?: string[];
  }>>;
}

export function CommunityFilters({ searchFilters, setSearchFilters }: CommunityFiltersProps) {
  const [filterSearch, setFilterSearch] = useState("");

  const activeTags = searchFilters.tags || [];
  const activeRoles = searchFilters.roles || [];

  const toggleTag = (tag: string) => {
    setSearchFilters(prev => ({
      ...prev,
      tags: activeTags.includes(tag)
        ? activeTags.filter(t => t !== tag)
        : [...activeTags, tag]
    }));
  };

  const toggleRole = (role: string) => {
    setSearchFilters(prev => ({
      ...prev,
      roles: activeRoles.includes(role)
        ? activeRoles.filter(r => r !== role)
        : [...activeRoles, role]
    }));
  };

  const clearFilters = () => {
    setSearchFilters({ tags: [], roles: [] });
  };

  const filteredTags = AVAILABLE_TAGS.filter(t =>
    t.toLowerCase().includes(filterSearch.toLowerCase())
  );
  const filteredRoles = AVAILABLE_ROLES.filter(r =>
    r.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pr-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          Filters <SlidersHorizontal className="inline size-4 ml-2 "/>
        </h3>
        {(activeTags.length > 0 || activeRoles.length > 0) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary"
          >
            Clear <X className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="relative mb-6 dark:bg-muted/10 bg-accent rounded-full">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          placeholder="Search tags or roles..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="pl-8 bg-muted/20 border-none h-9 text-xs focus-visible:ring-primary/20"
        />
      </div>

      <div className="space-y-6">
        {/* TAGS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[14px] font-semibold text-muted-foreground">
              Popular Tags
            </span>
            <span className="text-[12px] text-muted-foreground">{activeTags.length} selected</span>
          </div>
          <ScrollArea className="h-44 pr-3">
            <div className="flex flex-wrap gap-2.5 pt-1">
              {filteredTags.map((tag) => {
                const isSelected = activeTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-[11px] py-0.5 px-2 transition-all border-muted-foreground/30",
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                        : "dark:bg-muted/20 bg-accent/40 hover:bg-muted hover:border-primary/30 italic opacity-80"
                    )}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator className="opacity-100" />

        {/* ROLES SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[14px] font-semibold text-muted-foreground">
              Wanted Roles
            </span>
            <span className="text-[12px] text-muted-foreground">{activeRoles.length} selected</span>
          </div>
          <ScrollArea className="h-64 pr-3">
            <div className="space-y-1 pt-1">
              {filteredRoles.map((role) => {
                const isSelected = activeRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-all group",
                      isSelected 
                        ? "bg-primary/5 text-primary font-bold" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span className="capitalize line-clamp-1">{role}</span>
                    {isSelected ? (
                      <Check className="h-3 w-3 text-primary animate-in fade-in zoom-in duration-200" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-muted-foreground/20 group-hover:border-primary/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
