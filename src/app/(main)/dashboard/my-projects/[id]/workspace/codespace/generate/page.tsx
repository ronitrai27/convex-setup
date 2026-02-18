"use client";
import React, { useCallback, useState } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import ChatSection from "@/modules/generate/ChatSection";
import WebDesignPreview from "@/modules/generate/WebDesignPreview";
// import ElementSetting from "@/modules/generate/ElementSetting";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

const MIN_AI_WIDTH = 250;
const MAX_AI_WIDTH = 400;
const DEFAULT_MAIN_SIZE = 1000;
const DEFAULT_DESIGN_PREVIEW_WIDTH = 400;
const MIN_DESIGN_PREVIEW_WIDTH = 200;
const MAX_DESIGN_PREVIEW_WIDTH = 400;

const GeneratePage = () => {
  const params = useParams<{ id: Id<"projects"> }>();
  const [showTools, setShowTools] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [isReady, setIsReady] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  const GetCodeDetails = async () => {};

  // CALLBACKS---------------------------
  const UpdateCode = useCallback((code: string) => {
    setCurrentCode(code);
  }, []);

  const UpdateStatus = useCallback((status: string) => {
    setIsReady(status !== "streaming" && status !== "submitted");
  }, []);

  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );

  return (
    <div className="h-[calc(100vh-64px)] w-full border-t border-border">
      <Allotment>
        <Allotment.Pane
          snap
          minSize={MIN_AI_WIDTH}
          maxSize={MAX_AI_WIDTH}
          preferredSize={300}
        >
          <div className="h-full flex flex-col bg-muted/30 ">
            <ChatSection
              onCodeChange={UpdateCode}
              onStatusChange={UpdateStatus}
              onMessagesChange={setMessages}
            />
          </div>
        </Allotment.Pane>

        <Allotment.Pane>
          <div className="h-full flex flex-col bg-background border-x border-border">
            <WebDesignPreview
              onToggleTools={() => setShowTools(!showTools)}
              showTools={showTools}
              designCode={currentCode}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              messages={messages}
              projectId={params.id as any}
            />
          </div>
        </Allotment.Pane>

        <Allotment.Pane
          visible={showTools}
          minSize={MIN_DESIGN_PREVIEW_WIDTH}
          maxSize={MAX_DESIGN_PREVIEW_WIDTH}
          preferredSize={300}
        >
          <div className="w-full h-full bg-muted/30 border-l border-border">
            {/* <ElementSetting
              selectedElement={selectedElement}
              clearSelection={() => setSelectedElement(null)}
            /> */}
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};

export default GeneratePage;
