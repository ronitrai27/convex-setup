"use client";

import { useYjsStore } from "./UseYjsStore";
import { Tldraw, TLUiComponents, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useUser } from "@clerk/nextjs";
import { CollaboratorAvatars } from "./CollaboratorAvatar";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";
import { LiveCursors } from "./LiveCursor";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Brain, LucideStars } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../../../convex/_generated/api";

const components: Required<TLUiComponents> = {
  ContextMenu: null,
  ActionsMenu: null,
  HelpMenu: null,
  ZoomMenu: null,
  MainMenu: null,
  Minimap: null,
  StylePanel: null,
  PageMenu: null,
  NavigationPanel: null,
  Toolbar: null,
  KeyboardShortcutsDialog: null,
  QuickActions: null,
  HelperButtons: null,
  DebugPanel: null,
  DebugMenu: null,
  SharePanel: null,
  MenuPanel: null,
  TopPanel: null,
  CursorChatBubble: null,
  RichTextToolbar: null,
  ImageToolbar: null,
  VideoToolbar: null,
  Dialogs: null,
  Toasts: null,
  A11y: null,
  FollowingIndicator: null,
};

const Canvas = () => {
  const { user, isLoaded } = useUser();
  const updateMyPresence = useUpdateMyPresence();
  const params = useParams();
  const projectId = params.id as Id<"projects">;
  const [openConvert, setOpenConvert] = useState(false);
  const [description, setDescription] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const project = useQuery(api.projects.getProjectById, {
    projectId: projectId,
  });

  const inviteLink = project?.inviteLink;

  const userInfo = useMemo(() => {
    if (!user) return undefined;
    const name = user.fullName || user.username || "Anonymous";
    return {
      id: user.id,
      name: name,
      color: stringToColor(user.id),
      avatar: user.imageUrl,
    };
  }, [user]);

  const store = useYjsStore({
    roomId: "any",
    userInfo: userInfo ?? { id: "anon", name: "Anonymous", color: "#000000" },
  });

  //   CAPTURING CANVAS -------------------------
  const handleCaptureCanvas = async () => {
    if (!editor) return;

    setLoading(true);
    console.log("Optimizing canvas capture for size and quality...");

    try {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length === 0) {
        throw new Error("Canvas is empty!");
      }

      // Calculate the current bounding box of the shapes
      const bounds =
        editor.getSelectionPageBounds() ?? editor.getCurrentPageBounds();

      // Calculate scale to target ~1280px width (standard for vision models)
      // This ensures we don't send massive images if the user has a huge monitor
      const targetWidth = 1280;
      const scale = bounds ? Math.min(2, targetWidth / bounds.width) : 1;

      console.log(
        `Exporting ${shapeIds.length} shapes at scale ${scale.toFixed(2)}`,
      );

      const result = await editor.toImageDataUrl(shapeIds, {
        format: "jpeg",
        quality: 0.6, // 60% quality is perfect for sketches and saves ~40% space
        scale: scale,
        background: true,
      });

      console.log(
        "Capture successful. Base64 Size:",
        (result.url.length / 1024).toFixed(2),
        "KB",
      );

      setSnapshot(result.url);
      setOpenConvert(true);
    } catch (error) {
      console.error("Capture Error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to capture sketch.",
      );
    } finally {
      setLoading(false);
    }
  };

  //   SENDING TO AI ROUTE -------------------------
  const handleSendToVision = async () => {
    if (!snapshot) return;

    console.log("Sending to vision-prompt API...");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/vision-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: snapshot,
          description,
        }),
      });

      console.log("API Response status:", res.status);

      const data = await res.json();

      if (!res.ok) {
        console.error("API Error details:", data);
        throw new Error(data.error || "Failed to generate prompt");
      }

      console.log("Generated Prompt received:", data.prompt);
      router.push(`/dashboard/my-projects/${projectId}/workspace/codespace/generate?prompt=${encodeURIComponent(data.prompt)}`);
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setOpenConvert(false);
    }
  };

  function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  return (
    <div className="h-[calc(100vh-65px)] overflow-auto p-1 relative">
      <div className="absolute z-20 top-2 left-1/2 -translate-x-1/2 flex items-center gap-10">
        <CollaboratorAvatars inviteLink={inviteLink!} />
        <Button
          onClick={handleCaptureCanvas}
          disabled={loading}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer text-xs disabled:opacity-50"
        >
          {loading ? "Capturing..." : "Convert to Code"}{" "}
          <Brain className="ml-2 size-4" />
        </Button>
      </div>

      <Dialog open={openConvert} onOpenChange={setOpenConvert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Sketch to Code</DialogTitle>
            <DialogDescription>
              Are you sure you want your current sketch converted to code?
            </DialogDescription>
          </DialogHeader>

          {snapshot && (
            <div className="border rounded-md overflow-hidden bg-gray-50 flex justify-center p-2">
              <img
                src={snapshot}
                alt="Sketch Preview"
                className="max-h-40 object-contain"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short note for the AI..."
              className="max-h-24 resize-none"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setOpenConvert(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button disabled={loading} onClick={handleSendToVision}>
              {loading ? "Processing..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tldraw
        licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
        store={store}
        components={openConvert ? components : undefined}
        onMount={(editor) => {
          setEditor(editor);
          // Set initial user preferences locally
          if (userInfo) {
            editor.user.updateUserPreferences({
              name: userInfo.name,
              color: userInfo.color,
              id: userInfo.id,
            });
          }

          // Broadcast cursor presence
          editor.on("event", (e) => {
            if (e.name === "pointer_move") {
              const { x, y } = editor.inputs.currentPagePoint;
              updateMyPresence({ cursor: { x, y } });
            }
          });
        }}
      >
        <LiveCursors />
      </Tldraw>
    </div>
  );
};

export default Canvas;