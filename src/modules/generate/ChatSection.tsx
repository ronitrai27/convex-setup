import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LinkIcon,
  Loader,
  Loader2,
  LucideBot,
  LucideBrain,
  LucideExternalLink,
  LucideLoader,
  LucideToolbox,
  MessageSquare,
  ToolCase,
  X,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  Confirmation,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import { CheckIcon, XIcon } from "lucide-react";

import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { type ToolApprovalResponse } from "ai";
import { useSearchParams, useRouter } from "next/navigation";

type Props = {
  onCodeChange?: (code: string) => void;
  onStatusChange?: (status: string) => void;
  onMessagesChange?: (messages: any[]) => void;
};

const Suggestions = [
  "Create a SaaS landing page",
  "Create a soft minimal website",
  "create a login ui",
  "make a admin dashboard",
];

const ChatSection = ({
  onCodeChange,
  onStatusChange,
  onMessagesChange,
}: Props) => {
  const [input, setInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  // SCRAPING
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [urlCodeMessages, setUrlCodeMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);

  // AI calling sdk6
  const {
    messages,
    sendMessage,
    status,
    setMessages,
    addToolApprovalResponse,
    // addToolResult,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/generate",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasSentInitialMessage = useRef(false);

  // AUTOMATIC MESSAGE SENDING FROM URL PROMPT---------------------------
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && !hasSentInitialMessage.current && status === "ready") {
      sendMessage({
        parts: [{ type: "text", text: prompt }],
      });
      hasSentInitialMessage.current = true;

      // Clear the prompt from URL to prevent re-sending on refresh
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("prompt");
      const queryString = newParams.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
      router.replace(newUrl);
    }
  }, [searchParams, status, sendMessage, router]);

  // NOTIFY PARENT ABOUT MESSAGES---------------------------
  useEffect(() => {
    if (onMessagesChange) {
      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.parts })),
        ...urlCodeMessages.map((m) => ({ role: m.role, content: m.content })),
      ];
      onMessagesChange(allMessages);
    }
  }, [messages, urlCodeMessages, onMessagesChange]);

  const handleApproveTool = (id: string) => {
    addToolApprovalResponse({ id, approved: true });
  };

  const handleRejectTool = (id: string) => {
    addToolApprovalResponse({ id, approved: false });
    sendMessage({
      parts: [{ type: "text", text: "No, don't use this tool." }],
    });
  };

  console.log("messages in client side", messages);

  // STATUS CHANGE HANDLING-------------------------------------
  useEffect(() => {
    if (status === "submitted") {
      toast.loading("Analyzing context...", { id: "code-loading" });
    } else if (
      // @ts-ignore
      status !== "submitted" &&
      status !== "error" &&
      status === "streaming"
    ) {
      toast.dismiss("code-loading");
      toast.loading("Executing...", { id: "code-generation" });
    } else if (
      status === "ready" &&
      // @ts-ignore
      status !== "submitted" &&
      messages.length > 0
    ) {
      toast.dismiss("code-loading");
      toast.dismiss("code-generation");
      toast.success("Execution Successfull.");
    } else if (status === "error") {
      toast.dismiss("code-loading");
      toast.dismiss("code-generation");
      toast.error("Failed to execute.");
    }
  }, [status, onStatusChange]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    sendMessage({
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  // DETECT URL IN INPUT-------------------------------------
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = input.match(urlRegex);
    if (match && match[0]) {
      setDetectedUrl(match[0]);
    } else {
      setDetectedUrl(null);
    }
  }, [input]);

  const handleUrlCode = async () => {
    if (!detectedUrl) return;

    setIsScrapingUrl(true); // for loading part...
    try {
      setUrlCodeMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Recreate this website: ${detectedUrl}`,
        },
      ]);
      toast.loading("Processing website...", { id: "scrape" });

      const response = await fetch("/api/scrape-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: detectedUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process website");
      }

      toast.dismiss("scrape");
      toast.loading("Generating code...", { id: "code-generation" });

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let lastCodeLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedText += chunk;

          // Extract HTML code
          const match = accumulatedText.match(/```html\n([\s\S]*?)(```|$)/);
          if (match && match[1]) {
            const codeLength = match[1].length;
            if (codeLength > lastCodeLength) {
              setGeneratedCode(match[1]);
              lastCodeLength = codeLength;
            }
          }
        }
      }

      // Add success message
      if (lastCodeLength > 0) {
        setUrlCodeMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ I've analyzed ${detectedUrl} and generated ${lastCodeLength} characters of pixel-perfect HTML/Tailwind code. The recreation is now displaying in the preview panel.\n\n• View live preview\n• Edit by clicking elements\n• Download as React\n• Copy code\n• Save design`,
          },
        ]);
        toast.success("Website recreated!");
      } else {
        toast.error("⚠️ No code generated");
      }

      setInput("");
      setDetectedUrl(null);
    } catch (error) {
      console.error("💥 Error:", error);
      toast.error("Failed to process website");
      toast.dismiss("code-generation");

      setUrlCodeMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Failed: ${error}`,
        },
      ]);
    } finally {
      setIsScrapingUrl(false);
      toast.dismiss("code-generation");
      toast.dismiss("scrape");
    }
  };

  // CODE EXTRACTION-------------------------------------
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.parts) {
        const fullText = lastMessage.parts
          .filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("");

        // Extract code part
        const match = fullText.match(/```html\n([\s\S]*?)(```|$)/);
        if (match && match[1]) {
          setGeneratedCode(match[1]);
        }
      }
    }
  }, [messages]);

  // CODE CHANGE HANDLING WITH DEBOUNCE-------------------------------------
  useEffect(() => {
    if (onCodeChange && generatedCode) {
      const handler = setTimeout(() => {
        onCodeChange(generatedCode);
      }, 150);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [generatedCode, onCodeChange]);

  // STATUS CHANGE HANDLING-------------------------------------
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  console.log("generated code", generatedCode);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-border bg-muted p-3 flex justify-between items-center">
        <h3 className="font-semibold text-xl text-primary">
          <LucideBot className="mr-2 inline -mt-1" /> Codespace AI
        </h3>

        {/* if message , show clear button to clear message + generated code */}
        {(messages.length > 0 || urlCodeMessages.length > 0) && (
          <Button
            onClick={() => {
              setMessages([]);
              setGeneratedCode("");
              setUrlCodeMessages([]);
            }}
            className="cursor-pointer text-[10px] p-2!"
            size="sm"
            variant={"outline"}
          >
            <X /> Clear
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {/* URL Code Messages - Show BEFORE Conversation if no messages, AFTER if messages exist */}
        {messages.length === 0 && urlCodeMessages.length > 0 && (
          <div className="space-y-4 mb-4">
            {urlCodeMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  // User Message - URL Request with Preview
                  <div className="max-w-[90%] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon className="w-4 h-4" />
                        <span className="font-semibold text-sm">
                          Website Recreation Request
                        </span>
                      </div>
                      <p className="text-sm mb-3">{msg.content}</p>

                      {/* Website Preview Iframe */}
                      <div className="bg-white rounded-lg overflow-hidden border-2 border-blue-300 shadow-inner">
                        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                          </div>
                          <span className="text-xs text-gray-600 truncate flex-1">
                            {msg.content.replace("Recreate this website: ", "")}
                          </span>
                        </div>
                        <iframe
                          src={msg.content.replace(
                            "Recreate this website: ",
                            "",
                          )}
                          className="w-full h-48 bg-white"
                          sandbox="allow-same-origin"
                          title="Website Preview"
                          onError={(e) => {
                            // Fallback: hide iframe on error
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      {/* View Original Button */}
                      <a
                        href={msg.content.replace(
                          "Recreate this website: ",
                          "",
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        <LucideExternalLink className="w-4 h-4" />
                        View Original Website
                      </a>
                    </div>
                  </div>
                ) : (
                  // Assistant Message - Success Response
                  <div className="max-w-[90%] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl shadow-md overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <LucideBrain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Recreation Complete
                          </p>
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>

                      {/* Success Metrics */}
                      {msg.content.includes("characters") && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Code Size
                            </p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {msg.content.match(/(\d+)\s+characters/)?.[1] ||
                                "0"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              characters
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Status
                            </p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              ✓
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Ready
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Conversation>
          <ConversationContent>
            {messages.length === 0 && urlCodeMessages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Imagine anything and let Wekraft AI create it for you!"
              />
            ) : (
              <>
                {messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts?.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <MessageResponse key={`${message.id}-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );

                          default:
                            if (part.type === "tool-searchWeb") {
                              switch (part.state) {
                                case "approval-requested":
                                  return (
                                    <div
                                      key={part.toolCallId}
                                      className="p-2 bg-white dark:bg-gray-800 rounded-lg border"
                                    >
                                      <p className="text-sm font-medium font-pop mb-2">
                                        Requested for Web Tool calling for
                                        design recreation.
                                      </p>
                                      <div className="flex items-center gap-5">
                                        <Button
                                          size={"sm"}
                                          // variant={"default"}
                                          className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                                          onClick={() =>
                                            addToolApprovalResponse({
                                              id: part.approval.id,
                                              approved: true,
                                            })
                                          }
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size={"sm"}
                                          variant={"destructive"}
                                          onClick={() =>
                                            addToolApprovalResponse({
                                              id: part.approval.id,
                                              approved: false,
                                            })
                                          }
                                        >
                                          Deny
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                case "output-available":
                                  return (
                                    <div key={part.toolCallId}>
                                      <p className="flex items-center gap-2 bg-primary-foreground p-1.5 text-xs italic">
                                        {" "}
                                        <ToolCase /> Tool Executed Successfully
                                      </p>
                                    </div>
                                  );
                              }
                            }
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                ))}

                {(status === "streaming" || status === "submitted") && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 pl-1 animate-in fade-in duration-300">
                    <LucideLoader className="size-3 animate-spin" />
                    <span>
                      {status === "submitted"
                        ? "AI is thinking..."
                        : "AI is executing..."}
                    </span>
                  </div>
                )}
              </>
            )}
          </ConversationContent>
        </Conversation>

        {/* URL Code Messages - Show AFTER Conversation if messages exist */}
        {messages.length > 0 && urlCodeMessages.length > 0 && (
          <div className="space-y-4 mt-4">
            {urlCodeMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  // User Message - URL Request with Preview
                  <div className="max-w-[90%] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon className="w-4 h-4" />
                        <span className="font-semibold text-sm">
                          Website Recreation Request
                        </span>
                      </div>
                      <p className="text-sm mb-3">{msg.content}</p>

                      {/* Website Preview Iframe */}
                      <div className="bg-white rounded-lg overflow-hidden border-2 border-blue-300 shadow-inner">
                        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                          </div>
                          <span className="text-xs text-gray-600 truncate flex-1">
                            {msg.content.replace("Recreate this website: ", "")}
                          </span>
                        </div>
                        <iframe
                          src={msg.content.replace(
                            "Recreate this website: ",
                            "",
                          )}
                          className="w-full h-48 bg-white"
                          sandbox="allow-same-origin"
                          title="Website Preview"
                          onError={(e) => {
                            // Fallback: hide iframe on error
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      {/* View Original Button */}
                      <a
                        href={msg.content.replace(
                          "Recreate this website: ",
                          "",
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        <LucideExternalLink className="w-4 h-4" />
                        View Original Website
                      </a>
                    </div>
                  </div>
                ) : (
                  // Assistant Message - Success Response
                  <div className="max-w-[90%] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl shadow-md overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <LucideBrain className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-green-900 dark:text-green-100">
                            Looma AI
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Recreation Complete
                          </p>
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>

                      {/* Success Metrics */}
                      {msg.content.includes("characters") && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Code Size
                            </p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {msg.content.match(/(\d+)\s+characters/)?.[1] ||
                                "0"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              characters
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Status
                            </p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              ✓
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Ready
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Animated Loader for URL Scraping */}
        {isScrapingUrl && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <div className="relative">
                {/* <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-20" /> */}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Processing Website
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Analyzing layout, extracting styles, and generating code...
                </p>
                <div className="mt-2 flex gap-1">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* INPUT AREA */}
      <div className="relative mt-auto border-t border-border px-3 py-3">
        {detectedUrl ? (
          <div className="mb-2 p-1 bg-blue-50 dark:bg-gray-200 border border-blue-200 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <LinkIcon className="w-4 h-4" />
              <span className="font-medium">URL:</span>
              <span className="truncate max-w-[180px] text-sm text-muted-foreground dark:text-black">
                {detectedUrl}
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleUrlCode}
              disabled={isScrapingUrl}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs cursor-pointer"
            >
              {isScrapingUrl ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Processing
                </>
              ) : (
                "Recreate"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full mb-4 overflow-x-auto scrollbar-hide">
            {Suggestions.map((suggestion, index) => (
              <Button
                key={index}
                className="cursor-pointer text-[10px] p-2! rounded-full"
                size="sm"
                variant="outline"
                onClick={() => setInput(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        <Textarea
          className="resize-none h-18 p-1 bg-primary-foreground focus:outline-none focus:ring-0 shadow-sm"
          placeholder="Create  saas landing page..."
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
        <Button
          className="cursor-pointer text-xs absolute bottom-6 right-5"
          size="icon-sm"
          onClick={handleSendMessage}
          variant="default"
        >
          <LucideBrain />
        </Button>
      </div>
    </div>
  );
};

export default ChatSection;
