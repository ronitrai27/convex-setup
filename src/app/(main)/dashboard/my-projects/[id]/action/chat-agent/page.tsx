"use client";
import React from "react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, LucideSend, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { DefaultChatTransport } from "ai";
import { Input } from "@/components/ui/input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const ChatAgent = () => {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const suggestions = [
    "What is this repo about?",
    "How does Auth works here?",
    "Explain me the flow of this repo",
    "Which folder is for what?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion);
    setInput(suggestion);
  };
  return (
    <div>
      {/* PARENT CONTAINER  LEFT SIDE VERCEL AI AGENT RIGHT SIDE REACT FLOW  */}
      <div className="flex h-[calc(100vh-100px)]">
        {/* LEFT SIDE */}
        <div className="w-full min-w-[350px] max-w-[400px] bg-accent/40 border rounded-md  flex flex-col">
          <div className="space-y-2 p-3">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Chat With Repo
            </h1>
            <Separator />
          </div>

          <Conversation className="h-full p-0">
            {/* NEED A SHIMMER LOADING */}
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState>
                  <div className="text-center py-12">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">
                      Start a conversation
                    </h2>
                    <p className="text-muted-foreground">
                      Ask anything about Repo!
                    </p>
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts?.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <MessageResponse key={`${message.id}-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );
                          case "reasoning":
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full mb-4"
                                isStreaming={
                                  i === message.parts.length - 1 &&
                                  message.id === messages.at(-1)?.id
                                }
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          default:
                            return null;
                        }
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "submitted" ||
              (status === "streaming" &&
                messages.length > 0 &&
                messages[messages.length - 1].role === "user") ? (
                <div className="p-4 flex flex-col gap-2">
                  <Shimmer className="text-sm font-medium">Thinking...</Shimmer>
                </div>
              ) : null}
            </ConversationContent>

            <ConversationScrollButton />
          </Conversation>

          <div className="border-t mt-auto relative flex flex-col pt-4">
            <Suggestions className="mb-3 px-4">
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={handleSuggestionClick}
                  className="text-xs"
                />
              ))}
            </Suggestions>

            <Textarea
              rows={30}
              value={input}
              className="w-full p-2 h-20  rounded-md"
              onChange={(event) => {
                setInput(event.target.value);
              }}
              onKeyDown={async (event) => {
                if (event.key === "Enter") {
                  sendMessage({
                    parts: [{ type: "text", text: input }],
                  });
                }
              }}
            />
            <Button
              onClick={() =>
                sendMessage({ parts: [{ type: "text", text: input }] })
              }
              className="text-sm cursor-pointer absolute bottom-2 right-2"
              variant="outline"
              size="icon-sm"
            >
              <LucideSend />
            </Button>
          </div>
        </div>
        {/* RIGHT SIDE */}
      </div>
    </div>
  );
};

export default ChatAgent;
