"use client";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronLeft,
  Copy,
  GitCompareArrows,
  LucideCheckCircle2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../../convex/_generated/api";
import { Orb } from "@/components/elevenLabs/Orb";
import DialogOrb from "./_components/DialogOrb";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { Textarea } from "@/components/ui/textarea";
import LoaderPage from "@/modules/workspace/Loader";
import {
  LuActivity,
  LuCircleFadingPlus,
  LuClock3,
  LuCrosshair,
  LuLayers2,
} from "react-icons/lu";

const ProjectWorkspace = () => {
  const params = useParams();
  const projectId = params.id as Id<"projects">;
  const [isOrbOpen, setIsOrbOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isStartProject, setIsStartProject] = useState(false);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false);

  // Fetch project to get the repositoryId
  const project = useQuery(api.projects.getProjectById, { projectId });
  const project_details = useQuery(api.projects.getProject_Details, {
    projectId,
  });
  const projectName = project?.projectName;
  const repoId = project?.repositoryId;

  // console.log("PROJECT ID FRONTEND: ", projectId);
  // console.log("REPO ID FRONTEND: ", repoId);

  useEffect(() => {
    if (
      isStartProject &&
      project_details?.projectStatus === "completed" &&
      !hasTriggeredCompletion
    ) {
      setIsCompletedOpen(true);
      setHasTriggeredCompletion(true);
    }
  }, [project_details?.projectStatus, isStartProject, hasTriggeredCompletion]);

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    addToolApprovalResponse,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/project-agent",
      body: {
        projectId,
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isLastMessageFromAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    sendMessage({
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const handleStartButton = () => {
    // setMessages([
    //   {
    //     id: "1",
    //     role: "user",
    //     parts: [{ type: "text", text: "Hey , Lets start with mine project." }],
    //   },
    // ]);
    sendMessage({
      parts: [{ type: "text", text: "Hey , Lets start with mine project." }],
    });
    setIsStartProject(true);
  };

  if (!project) {
    return (
      <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center">
        <Loader />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading project...
        </span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full p-6 relative ">
      {!isStartProject && (
        <Link href={`/dashboard/my-projects/${projectId}`}>
          <Button
            className="text-xs cursor-pointer"
            variant="outline"
            size="sm"
          >
            <ChevronLeft />
            Back to Home
          </Button>
        </Link>
      )}

      <AnimatePresence mode="wait">
        {project_details && project_details.projectStatus === "completed" ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            its completed
            <br />
            timeline chart
            <br />
            velocity (how much each task is been completed in time)
          </motion.div>
        ) : (
          <motion.main
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full flex flex-col px-12 max-w-5xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {isStartProject ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full w-full"
                >
                  <h1 className="text-2xl font-bold text-center my-2">
                    Project Initialization Details
                    <GitCompareArrows className="inline size-7 ml-2" />
                  </h1>
                  <p className="text-center text-lg text-muted-foreground mb-4">
                    Answer the following questions to initialize your project.
                  </p>

                  <Conversation>
                    <ConversationContent>
                      <>
                        {messages.map((message, messageIndex) => {
                          const isLastMessage =
                            messageIndex === messages.length - 1;
                          const isStreaming =
                            status === "streaming" && isLastMessage;

                          return (
                            <div key={message.id}>
                              {message.parts.map((part, partIndex) => {
                                if (part.type === "reasoning") {
                                  return (
                                    <Reasoning
                                      key={`${message.id}-${partIndex}`}
                                      isStreaming={
                                        isStreaming &&
                                        partIndex === message.parts.length - 1
                                      }
                                    >
                                      <ReasoningTrigger />
                                      <ReasoningContent>
                                        {part.text}
                                      </ReasoningContent>
                                    </Reasoning>
                                  );
                                }

                                if (part.type === "text") {
                                  return (
                                    <Message
                                      key={`${message.id}-${partIndex}`}
                                      from={message.role}
                                    >
                                      <MessageContent>
                                        <MessageResponse>
                                          {part.text}
                                        </MessageResponse>
                                      </MessageContent>
                                      {message.role === "assistant" &&
                                        isLastMessage &&
                                        !isStreaming && (
                                          <MessageActions>
                                            <MessageAction
                                              tooltip="Copy"
                                              // onClick={() => handleCopy(part.text)}
                                            >
                                              <Copy className="size-3" />
                                            </MessageAction>
                                            <MessageAction
                                              tooltip="Regenerate"
                                              // onClick={onRegenerate}
                                            >
                                              <RefreshCw className="size-3" />
                                            </MessageAction>
                                          </MessageActions>
                                        )}
                                    </Message>
                                  );
                                }

                                // Handle tool parts (type starts with "tool-")
                                if (part.type.startsWith("tool-")) {
                                  const toolPart = part as {
                                    type: `tool-${string}`;
                                    state:
                                      | "input-streaming"
                                      | "input-available"
                                      | "output-available"
                                      | "output-error";
                                    input?: unknown;
                                    output?: unknown;
                                    errorText?: string;
                                  };

                                  // Auto-open completed or error tools
                                  const shouldOpen =
                                    toolPart.state === "output-available" ||
                                    toolPart.state === "output-error";

                                  return (
                                    <div
                                      key={`${message.id}-${partIndex}`}
                                      className="my-2 ml-10"
                                    >
                                      <Tool defaultOpen={shouldOpen}>
                                        <ToolHeader
                                          type={toolPart.type}
                                          state={toolPart.state}
                                        />
                                        <ToolContent>
                                          <ToolInput input={toolPart.input} />
                                          {(toolPart.state ===
                                            "output-available" ||
                                            toolPart.state ===
                                              "output-error") && (
                                            <ToolOutput
                                              output={toolPart.output}
                                              errorText={toolPart.errorText}
                                            />
                                          )}
                                        </ToolContent>
                                      </Tool>
                                    </div>
                                  );
                                }

                                return null;
                              })}
                            </div>
                          );
                        })}

                        {status === "submitted" && (
                          <div className="flex items-center gap-2">
                            <Loader />
                            <span className="text-sm text-muted-foreground">
                              Thinking...
                            </span>
                          </div>
                        )}

                        {status === "error" && (
                          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                            <AlertCircle className="size-4 text-destructive" />
                            <span className="flex-1 text-sm text-destructive">
                              Failed to get response
                            </span>
                            {isLastMessageFromAssistant && (
                              <Button
                                variant="ghost"
                                size="sm"
                                //   onClick={onRegenerate}
                                className="text-destructive hover:text-destructive"
                              >
                                <RefreshCw className="mr-1 size-3" />
                                Retry
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    </ConversationContent>
                  </Conversation>
                  <div className="mt-auto relative my-5 border-t p-4 max-w-[600px] mx-auto w-full">
                    <Textarea
                      className="resize-none h-14 p-1 bg-primary-foreground focus:outline-none focus:ring-0 shadow-sm"
                      placeholder="Write down your idea..."
                      value={input}
                      onChange={(event) => {
                        setInput(event.target.value);
                      }}
                      onKeyDown={async (event) => {
                        if (event.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* NICE UI/UX TO PROMPT USER TO START PROJECT INITIALIZATION WITH AGENT ! */}
                  <h1 className="text-2xl text-center font-semibold">
                    Welcome to your personalized workspace{" "}
                    <LuActivity className="inline ml-1" />
                  </h1>
                  <h3 className="text-muted-foreground text-center mt-1.5 mb-8 italic text-base">
                    Start by initializing your project agent, and let's us
                    handle the rest...
                  </h3>
                  <LoaderPage />

                  <div className="flex items-center gap-10 justify-center mt-10">
                    <Button size="lg" variant={"outline"}>
                      Know More <LuCircleFadingPlus className="inline ml-1" />
                    </Button>
                    <Button size="lg" onClick={handleStartButton}>
                      Get started <LuCrosshair className="inline ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        )}
      </AnimatePresence>

      <Dialog open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
        <DialogContent className="sm:max-w-lg border-t-8 border-t-blue-600/40 dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <span className="p-2 rounded-md bg-blue-600/20 text-blue-600">
                <LuLayers2 className="h-5 w-5" />
              </span>
              Project Initialized!
            </DialogTitle>

            <DialogDescription className="text-base my-3 italic">
              Your project has been successfully planned and initialized by the
              Agent. You can now start working on your project or
              collaborating...
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex w-full items-center gap-5 justify-center">
              {/* Timeline Card */}
              <div className="rounded-lg border bg-muted/50 p-4 w-full transition hover:shadow-sm">
                <h4 className="font-medium mb-1 flex items-center gap-2 text-sm">
                  <LuClock3 className="h-4 w-4 text-blue-500" />
                  Timeline
                </h4>
                <p className="text-sm text-muted-foreground">
                  {project_details?.projectTimeline || "Not specified"}
                </p>
              </div>

              {/* Status Card */}
              <div className="rounded-lg border bg-muted/50 p-4 w-full transition hover:shadow-sm">
                <h4 className="font-medium mb-1 flex items-center gap-2 text-sm">
                  <LucideCheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Status
                </h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Planned
                </p>
              </div>
            </div>

            {/* Overview */}
            <div className="bg-accent/40 p-4 rounded-lg border-dashed border-2 text-sm tracking-tight leading-relaxed transition hover:bg-accent/60">
              <p className="text-muted-foreground">
                {project_details?.projectOverview}
              </p>
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button
              onClick={() => setIsCompletedOpen(false)}
              className="w-full sm:w-auto transition hover:scale-[1.02]"
            >
              Let&apos;s Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* SHOW MAIN ONLY WHEN PROJECTDETAILS TABLE HAS completed status */}

      {/* Orb Button  */}
      <Button
        onClick={() => setIsOrbOpen(true)}
        className="absolute bottom-10 right-6 cursor-pointer p-0! rounded-full "
        variant={"ghost"}
      >
        <div className="bg-muted relative h-15 w-15 rounded-full   shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
            <Orb
              colors={["#CADCFC", "#A0B9D1"]}
              seed={1000}
              agentState={null}
            />
          </div>
        </div>
      </Button>

      <DialogOrb
        isOrbOpen={isOrbOpen}
        setIsOrbOpen={setIsOrbOpen}
        repoId={repoId as Id<"repositories">}
      />
    </div>
  );
};

export default ProjectWorkspace;
