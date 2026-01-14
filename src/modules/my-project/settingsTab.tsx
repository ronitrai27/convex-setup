"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  X,
  Plus,
  Save,
  Loader2,
  Search,
  Trash2,
  Users,
  LucideSettings2,
  LucideSettings,
  Tag,
  LucideType,
  LucideActivity,
  LucideBriefcase,
  LucideBrain,
  LucideInfo,
  LucideExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AVAILABLE_TAGS, roles } from "@/components/Universal-static-storage";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

interface LookingForMember {
  role: string;
  type: "casual" | "part-time" | "serious";
}

interface ProjectData {
  _id: Id<"projects">;
  projectName: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  lookingForMembers?: LookingForMember[];
}

const SettingTab = ({ project, isPro }: { project: ProjectData; isPro: boolean }) => {
  const updateProject = useMutation(api.projects.updateProject);

  // Local state for form fields
  const [description, setDescription] = useState(project.description);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    project.tags || []
  );
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [lookingForMembers, setLookingForMembers] = useState<
    LookingForMember[]
  >(project.lookingForMembers || []);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);

  // New Role Form State
  const [newRole, setNewRole] = useState("");
  const [newRoleType, setNewRoleType] = useState<
    "casual" | "part-time" | "serious"
  >("casual");

  const [roleQuery, setRoleQuery] = useState("");

  // Handlers
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        toast.error("You can select a maximum of 5 tags.");
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    setLookingForMembers([
      ...lookingForMembers,
      { role: newRole, type: newRoleType },
    ]);
    setIsAddRoleOpen(false);
    setNewRole("");
    setNewRoleType("casual");
    toast.info(`Role ${newRole} added! Don't forget to save changes.`);
  };

  const handleRemoveRole = (index: number) => {
    const newList = [...lookingForMembers];
    newList.splice(index, 1);
    setLookingForMembers(newList);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProject({
        projectId: project._id,
        description,
        tags: selectedTags,
        isPublic,
        lookingForMembers,
      });
      toast.success("Project settings updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTags = AVAILABLE_TAGS.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <h2 className="text-xl font-semibold">
        Configure your project{" "}
        <LucideSettings2 className="w-5 h-5 inline ml-2" />
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>
            {" "}
            <LucideSettings className="w-4 h-4 inline mr-2" />
            Project Details
          </CardTitle>
          <CardDescription>
            Update the core details of your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          <div
            className={`flex items-center justify-between rounded-lg border p-4  ${
              isPublic ? "bg-emerald-300/20" : "bg-muted/40"
            }`}
          >
            <div className="space-y-0.5">
              <Label className="text-base">Public Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your project visible to everyone. Public projects can be
                discovered by the community.
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              aria-label="Toggle public visibility"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Tag className="w-4 h-4 inline mr-2" /> Tags
          </CardTitle>
          <CardDescription>
            Select up to 5 tags that best describe your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-2">
                No tags selected
              </p>
            )}
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1"
              >
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Search & Selection */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {filteredTags.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {filteredTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className={`cursor-pointer transition-all hover:scale-105 active:scale-95 text-[11px] px-4 py-3 ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags found matching "{tagSearch}"
                </p>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <div className={` ${isPublic ? "hidden opacity-0" : "opacity-100 "}`}>
        <p className="text-center text-lg tracking-tight font-semibold">
          <LucideInfo className="inline w-4 h-4 mr-2" /> Kindly make your
          project public to allow Others, discover & find Team members
        </p>
      </div>

      {/* ------------------AI BUTTTON ------------------ */}
      {isPublic && (
        <div className="bg-accent/40 p-2 rounded-md w-full">
          <p className="text-sm  text-muted-foreground">
            <LucideInfo className="inline w-4 h-4 mr-2" /> Make Sure to have
            Right Tags, description, About & Good project health , so that 
            your project can be found by more people.
          </p>

          {isPro ? (
            <Button size="sm" className="text-xs cursor-pointer mt-2 w-fit mx-auto flex items-center justify-center">
              <LucideBrain className="w-4 h-4" /> Analyze Project
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="text-xs cursor-pointer mt-2 w-fit mx-auto flex items-center justify-center"
            >
              <LucideExternalLink className="w-4 h-4" /> Unlock Pro
            </Button>
          )}
        </div>
      )}

      {/* Team Settings Section */}
      <Card
        className={`${
          isPublic ? "" : "opacity-30 border-dashed pointer-events-none"
        }`}
      >
        <CardHeader>
          <CardTitle>
            <Users className="w-4 h-4 inline mr-2" /> Team & Roles
          </CardTitle>
          <CardDescription>
            Manage open positions and let others know you're looking for
            teammates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">
                Add Roles and Types, you are looking for.
              </p>
            </div>

            {/* ============================================= */}
            <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4 " /> Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[500px] min-h-[350px] p-5">
                <DialogHeader>
                  <DialogTitle>Add a Role</DialogTitle>
                  <DialogDescription>
                    Specify the role and commitment level you are looking for.
                  </DialogDescription>
                </DialogHeader>
                <Separator />
                <div className="flex flex-col   w-full">
                  {/* ROLE */}
                  <div className="flex flex-col gap-2 w-full mb-5">
                    <Label htmlFor="role">
                      {" "}
                      <LucideBriefcase className="w-4 h-4 inline mr-2" /> Role
                    </Label>

                    <div className="w-full">
                      <Command>
                        <CommandInput
                          placeholder="Search role..."
                          value={roleQuery}
                          onValueChange={(value) => setRoleQuery(value)}
                          className="bg-transparent"
                        />

                        {roleQuery.length > 0 && (
                          <>
                            <CommandEmpty>No role found.</CommandEmpty>

                            <CommandGroup className="max-h-[120px] overflow-y-scroll">
                              {roles
                                .filter((role) =>
                                  role
                                    .toLowerCase()
                                    .includes(roleQuery.toLowerCase())
                                )
                                .slice(0, 6)
                                .map((role) => (
                                  <CommandItem
                                    key={role}
                                    value={role}
                                    onSelect={(value) => {
                                      setNewRole(value);
                                      setRoleQuery(value);
                                    }}
                                  >
                                    {role}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </>
                        )}
                      </Command>
                    </div>
                  </div>

                  {/* TYPE */}
                  <div className="flex flex-col gap-2 w-full mt-auto">
                    <Label htmlFor="type">
                      <LucideActivity className="w-4 h-4 inline mr-2" /> Type
                    </Label>

                    <div className="w-full">
                      <Select
                        value={newRoleType}
                        onValueChange={(v: any) => setNewRoleType(v)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select commitment type" />
                        </SelectTrigger>

                        <SelectContent className="p-3">
                          <SelectItem value="casual" className="py-2">
                            Casual (Side Projects / Hobbies)
                          </SelectItem>
                          <SelectItem value="part-time" className="py-2">
                            Part-Time (Hackathon / Events)
                          </SelectItem>
                          <SelectItem value="serious">
                            Serious (MVP / Startup)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddRoleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddRole}>Add Role</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* List of Roles */}
          {lookingForMembers.length > 0 ? (
            <div className="rounded-md border">
              <div className="p-4 bg-muted/20 border-b">
                <h4 className="text-sm font-semibold">
                  Current Open Positions
                </h4>
              </div>
              <div className="divide-y">
                {lookingForMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-full ring-1 ring-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-sm text-foreground">
                          {member.role}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider font-semibold"
                          >
                            {member.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveRole(idx)}
                      aria-label={`Remove ${member.role} role`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
              <Users className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm font-medium">No roles listed yet</p>
              <p className="text-xs mt-1">Click "Add Role" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Action */}
      <div className="flex justify-end sticky bottom-6 z-10">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto min-w-[150px] shadow-lg hover:shadow-xl transition-all text-xs cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving
              Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingTab;
