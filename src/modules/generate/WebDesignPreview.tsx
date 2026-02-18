"use client";
import { Button } from "@/components/ui/button";
import {
  Braces,
  CheckCircle2,
  ExternalLink,
  LucideCode2,
  LucideDownload,
  LucideExternalLink,
  LucideEye,
  LucideGlobe,
  LucideMonitor,
  LucidePaintBucket,
  LucidePaintbrush,
  LucidePen,
  LucidePhone,
  LucideTablet,
  LucideTabletSmartphone,
  ToolCase,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CodeExporting from "./CodeExporting";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import LoaderPage from "../workspace/Loader";

interface WebDesignPreviewProps {
  onToggleTools: () => void;
  showTools: boolean;
  designCode: string;
  selectedElement: HTMLElement | null;
  setSelectedElement: (element: HTMLElement | null) => void;
  messages: any[];
  projectId: string;
}

const getShell = (code: string, isDesign: boolean = false) => `
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
      ${
        isDesign
          ? `
      .hover-outline { outline: 2px dotted #3b82f6 !important; outline-offset: -2px !important; }
      .selected-outline { outline: 2px solid #ef4444 !important; outline-offset: -2px !important; }
      `
          : ""
      }
    </style>
</head>
<body class="bg-gray-50">
${code}
</body>
</html>
`;

const WebDesignPreview = ({
  onToggleTools,
  showTools,
  designCode,
  selectedElement,
  setSelectedElement,
  messages,
  projectId,
}: WebDesignPreviewProps) => {
  const [displayCode, setDisplayCode] = useState("");
  const [selectedScreen, setSelectedScreen] = useState<
    "web" | "mobile" | "tablet"
  >("web");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"preview" | "design">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // SAVING LOGIC STATE-----------------------
  const [codespaceName, setCodespaceName] = useState("");
  const [codespaceDescription, setCodespaceDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const saveCodespace = useMutation(api.codespace.createCodespace);

  const handleSaveCodespace = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to save codespaces.");
      return;
    }

    if (!codespaceName.trim()) {
      toast.error("Please provide a name for your codespace.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving your codespace...");

    try {
      await saveCodespace({
        projectId: projectId as Id<"projects">,
        createdBy: currentUser._id,
        codespaceName,
        codespaceDescription,
        code: displayCode,
        messageHistory: messages,
      });

      toast.success("Codespace saved successfully!", { id: toastId });
      setCodespaceName("");
      setCodespaceDescription("");
    } catch (error) {
      console.error("Error saving codespace:", error);
      toast.error("Failed to save codespace. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // RENDERING CODE ON IFRAME-----------------------
  useEffect(() => {
    if (designCode) {
      setDisplayCode(designCode);
      setIsLoading(false);
    }
  }, [designCode]);

  const fullHtml = getShell(displayCode, true);

  // ONLY WHEN ITS IN DESIGN MODE SELECTED (NOT PREVIEW)
  // SELECTABLE DOM ELEMENT-------------------------------
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !displayCode) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Helper to cleanup selections
    const cleanupSelections = (d: Document) => {
      const selected = d.querySelector(".selected-outline");
      if (selected) {
        selected.classList.remove("selected-outline");
        selected.removeAttribute("contenteditable");
      }
      const hovered = d.querySelector(".hover-outline");
      if (hovered) {
        hovered.classList.remove("hover-outline");
      }
    };

    let hoverEl: HTMLElement | null = null;
    let selectedEl: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      if (selectedEl) return;
      const target = e.target as HTMLElement;
      if (target === doc.body || target === doc.documentElement) return;
      if (hoverEl && hoverEl !== target)
        hoverEl.classList.remove("hover-outline");
      hoverEl = target;
      hoverEl.classList.add("hover-outline");
    };

    const handleMouseOut = () => {
      if (selectedEl) return;
      if (hoverEl) {
        hoverEl.classList.remove("hover-outline");
        hoverEl = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === doc.body || target === doc.documentElement) return;
      e.preventDefault();
      e.stopPropagation();
      if (selectedEl && selectedEl !== target) {
        selectedEl.classList.remove("selected-outline");
        selectedEl.removeAttribute("contenteditable");
      }
      selectedEl = target;
      selectedEl.classList.add("selected-outline");
      selectedEl.setAttribute("contenteditable", "true");
      selectedEl.focus();
      setSelectedElement(selectedEl);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEl) {
        selectedEl.classList.remove("selected-outline");
        selectedEl.removeAttribute("contenteditable");
        selectedEl = null;
        setSelectedElement(null);
      }
    };

    const applyLayer = () => {
      if (!doc || !doc.body) return;
      if (mode === "design") {
        doc.body.addEventListener("mouseover", handleMouseOver);
        doc.body.addEventListener("mouseout", handleMouseOut);
        doc.body.addEventListener("click", handleClick);
        doc.addEventListener("keydown", handleKeyDown);
      } else {
        cleanupSelections(doc);
        setSelectedElement(null);
      }
    };

    // Apply logic based on current mode
    applyLayer();

    // If iframe reloads, we need to re-apply
    const onIframeLoad = () => {
      // Small delay to ensure doc is ready
      setTimeout(applyLayer, 100);
    };
    iframe.addEventListener("load", onIframeLoad);

    return () => {
      if (doc && doc.body) {
        doc.body.removeEventListener("mouseover", handleMouseOver);
        doc.body.removeEventListener("mouseout", handleMouseOut);
        doc.body.removeEventListener("click", handleClick);
      }
      if (doc) {
        doc.removeEventListener("keydown", handleKeyDown);
        cleanupSelections(doc);
      }
      if (iframe) {
        iframe.removeEventListener("load", onIframeLoad);
      }
      setSelectedElement(null);
    };
  }, [displayCode, mode]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* header */}
      <div className="h-12 border-b border-border bg-muted p-3 w-full flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            className="text-xs cursor-pointer"
            onClick={() => setMode("preview")}
          >
            Preview <LucideEye />
          </Button>
          <Button
            variant={mode === "design" ? "default" : "outline"}
            size="sm"
            className="text-xs cursor-pointer"
            onClick={() => setMode("design")}
          >
            Design <LucidePaintbrush />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* SAVING CODE */}

          <Popover>
            <PopoverTrigger asChild>
              <Button className="cursor-pointer text-xs" size="sm">
                Save <LucideCode2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 overflow-x-auto p-2!">
              <div>
                <h1 className="text-sm font-medium">
                  Save the code to your project{" "}
                  <LucideCode2 className="inline h-4 w-4 ml-1 -mt-0.5" />
                </h1>
                <div className="flex-col flex space-y-1.5 mt-4 p-2 bg-primary-foreground border rounded">
                  <Label className="text-xs">Codespace Name</Label>
                  <Input
                    placeholder="eg: login v1"
                    className="focus:outline-none border-border"
                    value={codespaceName}
                    onChange={(e) => setCodespaceName(e.target.value)}
                  />

                  <Label className="text-xs">Codespace Description</Label>
                  <Input
                    placeholder="eg: Login page for v1"
                    className="focus:outline-none border-border"
                    value={codespaceDescription}
                    onChange={(e) => setCodespaceDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="cursor-pointer text-xs mt-2 w-full"
                  onClick={handleSaveCodespace}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Codespace"} <Braces />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            size="sm"
            variant={"outline"}
            className="text-xs cursor-pointer"
            onClick={() => {
              const publishHtml = getShell(designCode, false);
              const blob = new Blob([publishHtml], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            }}
          >
            View <ExternalLink />
          </Button>
          <Button
            className={`cursor-pointer text-xs transition-all duration-300 ${
              showTools ? "bg-primary text-primary-foreground" : ""
            }`}
            size="sm"
            variant={showTools ? "default" : "outline"}
            onClick={onToggleTools}
          >
            {showTools ? "Hide Tools" : "View Tools"} <ToolCase />
          </Button>
        </div>
      </div>
      {/* design preview */}
      <div className={`w-full h-full p-2 flex-1 bg-primary-foreground`}>
        {displayCode.length === 0 && designCode.length === 0 && !isLoading && (
          <div className="max-w-[500px] mx-auto h-full flex items-center justify-center">
            <div
              className={` group flex flex-col h-[340px] w-full rounded-2xl border bg-neutral-900 overflow-hidden shadow-2xl shadow-black/50`}
            >
              {/* Window Preview Area */}
              <div className="p-5 pt-8 bg-neutral-900 flex-1 flex flex-col justify-end">
                <div className="w-full rounded-t-lg bg-neutral-950 border border-neutral-800 border-b-0 overflow-hidden shadow-xl">
                  {/* Window Header */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border-b border-neutral-800/50">
                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                  </div>
                  {/* Window Body: Dashboard Layout */}
                  <div className="flex h-40 bg-neutral-950">
                    {/* Sidebar */}
                    <div className="w-14 border-r border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 p-2 pt-3">
                      <div className="h-4 w-4 rounded-md bg-neutral-700/50 mb-1 mx-auto"></div>
                      {/* Active Nav */}
                      <div className="h-7 w-full bg-neutral-800 rounded-md flex items-center justify-center border border-neutral-700/50 shadow-sm">
                        <div className="h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(132,204,22,0.6)] animate-pulse"></div>
                      </div>
                      {/* Inactive Nav */}
                      <div className="h-7 w-full flex items-center justify-center opacity-40">
                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                      </div>
                      <div className="h-7 w-full flex items-center justify-center opacity-40">
                        <div className="h-1 w-4 bg-neutral-700 rounded-full"></div>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-3 flex flex-col gap-3">
                      {/* Breadcrumb & User */}
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-800/50">
                        <div className="h-1.5 w-16 bg-neutral-800 rounded-full"></div>
                        <div className="flex gap-1.5 items-center">
                          <div className="h-1.5 w-8 bg-neutral-800 rounded-full hidden sm:block"></div>
                          <div className="h-3 w-3 rounded-full bg-neutral-700"></div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Card 1 */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5">
                          <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                          <div className="flex items-end justify-between">
                            <div className="h-2.5 w-8 bg-neutral-600 rounded-sm"></div>
                            <div className="h-3 w-6 bg-lime-500/20 rounded-sm flex items-center justify-center">
                              <div className="h-0.5 w-3 bg-sky-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-2 flex flex-col gap-1.5 opacity-60">
                          <div className="h-1 w-6 bg-neutral-700 rounded-full opacity-50"></div>
                          <div className="flex items-end justify-between">
                            <div className="h-2.5 w-5 bg-neutral-600 rounded-sm"></div>
                            <div className="h-3 w-3 rounded-full bg-neutral-800"></div>
                          </div>
                        </div>
                      </div>

                      {/* Activity List */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-2 p-1.5 rounded-md bg-neutral-900/30 border border-neutral-800/50">
                          <div className="h-4 w-4 rounded bg-lime-900/20 border border-sky-500/30 shrink-0"></div>
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="h-1 w-12 bg-neutral-700 rounded-full"></div>
                            <div className="h-1 w-8 bg-neutral-800 rounded-full"></div>
                          </div>
                          <div className="h-1.5 w-6 bg-sky-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-md border border-transparent opacity-50">
                          <div className="h-4 w-4 rounded bg-neutral-800 shrink-0"></div>
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="h-1 w-10 bg-neutral-700 rounded-full"></div>
                            <div className="h-1 w-6 bg-neutral-800 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Card Footer */}
              <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between z-20 relative">
                <span className="text-base font-medium text-white tracking-tight">
                 Custom components in Once click
                </span>
                <div className="text-sky-500">
                  <CheckCircle2 className="w-6 h-6 fill-lime-500/10" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Iframe preview */}
        {displayCode.length > 0 && (
          <motion.div
            className={`h-full transition-all duration-500 ease-linear
              ${
                selectedScreen === "web"
                  ? "w-full rounded-none ring-0 mx-auto"
                  : selectedScreen === "tablet"
                    ? "w-[768px] rounded-xl ring-4 ring-accent mx-auto"
                    : "w-[375px] rounded-2xl ring-6 ring-accent mx-auto"
              }`}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full border-none"
              srcDoc={fullHtml}
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              title="Website Preview"
            ></iframe>
          </motion.div>
        )}
      </div>

      {/* Tools */}
      <div className="border-y p-3 h-14  mt-auto flex justify-between px-6 bg-muted">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon-sm"
            className={
              selectedScreen === "web"
                ? "bg-blue-600 text-white border-blue-600 hover:border-none cursor-pointer duration-300 transition-colors"
                : ""
            }
            onClick={() => setSelectedScreen("web")}
            title="Web View"
          >
            <LucideMonitor />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className={
              selectedScreen === "tablet"
                ? "bg-blue-600 text-white border-blue-600 hover:border-none cursor-pointer duration-300 transition-colors"
                : ""
            }
            onClick={() => setSelectedScreen("tablet")}
            title="Tablet View"
          >
            <LucideTabletSmartphone />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className={
              selectedScreen === "mobile"
                ? "bg-blue-600 text-white border-blue-600 hover:border-none cursor-pointer duration-300 transition-colors"
                : ""
            }
            onClick={() => setSelectedScreen("mobile")}
            title="Mobile View"
          >
            <LucideTablet />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="sm"
            className="cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
          >
            Publish <LucideGlobe />
          </Button>
          <CodeExporting displayCode={designCode} />
        </div>
      </div>
    </div>
  );
};

export default WebDesignPreview;
