// "use client";

// import { useState, useCallback, useEffect, useMemo } from "react";
// // import axios from "axios";
// import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai";
// import { toast } from "sonner";
// import { Toaster } from "sonner";
// import {
//   ReactFlow,
//   Controls,
//   MiniMap,
//   Background,
//   BackgroundVariant,
//   useNodesState,
//   useEdgesState,
//   addEdge,
//   Connection,
// } from "@xyflow/react";
// import "@xyflow/react/dist/style.css";
// import EntityNode from "@/modules/my-project/EntityNode";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import {
//   Loader2,
//   Send,
//   Bot,
//   Database,
//   Search,
//   ChevronDown,
//   ChevronRight,
//   X,
//   Upload,
//   Download,
//   Paperclip,
//   FileText,
//   PanelRight,
// } from "lucide-react";
// import {
//   Conversation,
//   ConversationContent,
//   ConversationEmptyState,
//   ConversationScrollButton,
// } from "@/components/ai-elements/conversation";
// import {
//   Message,
//   MessageContent,
//   MessageResponse,
// } from "@/components/ai-elements/message";
// import {
//   Reasoning,
//   ReasoningContent,
//   ReasoningTrigger,
// } from "@/components/ai-elements/reasoning";
// import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";

// import {
//   cn,
//   downloadAsPNG,
//   filterNodes,
//   ermodelToReactFlow,
//   applyDagreLayout,
// } from "@/modules/my-project/ErHelper";
// import type {
//   ERModel,
//   EntityNode as EntityNodeType,
//   EntityEdge,
// } from "@/types/ERmodel";

// const nodeTypes = { entity: EntityNode };

// export default function Home() {
//   // Schema and session state
//   const [sessionId, setSessionId] = useState<string | null>(null);
//   const [schema, setSchema] = useState<ERModel | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadError, setUploadError] = useState<string | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [pastedContent, setPastedContent] = useState("");
//   const [chatInput, setChatInput] = useState("");

//   // SCHEMA TOGGLE
//   const [isSchemaOpen, setIsSchemaOpen] = useState(false);

//   // React Flow diagram state
//   const [nodes, setNodes, onNodesChange] = useNodesState<EntityNodeType>([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState<EntityEdge>([]);

//   // UI state for explorer and sidebar
//   const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
//   const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sidebarWidth, setSidebarWidth] = useState(384);
//   const [isResizing, setIsResizing] = useState(false);

//   const startResizing = useCallback(() => {
//     setIsResizing(true);
//   }, []);

//   const stopResizing = useCallback(() => {
//     setIsResizing(false);
//   }, []);

//   const resize = useCallback(
//     (mouseMoveEvent: MouseEvent) => {
//       if (isResizing) {
//         setSidebarWidth((currentWidth) => {
//           const newWidth = mouseMoveEvent.clientX;
//           if (newWidth < 250) return 250; // Min width
//           if (newWidth > 600) return 600; // Max width
//           return newWidth;
//         });
//       }
//     },
//     [isResizing]
//   );

//   useEffect(() => {
//     window.addEventListener("mousemove", resize);
//     window.addEventListener("mouseup", stopResizing);
//     return () => {
//       window.removeEventListener("mousemove", resize);
//       window.removeEventListener("mouseup", stopResizing);
//     };
//   }, [resize, stopResizing]);

//   // Chat transport - memoized to prevent stale closures when schema/sessionId updates
//   const transport = useMemo(
//     () =>
//       new DefaultChatTransport({
//         api: "/api/chat",
//         headers: () => ({
//           "x-session-id": sessionId || "",
//         }),
//         body: () => ({
//           schemaContext: schema
//             ? {
//                 tableCount: schema.entities.length,
//                 tables: schema.entities.map((e) => ({
//                   name: e.name,
//                   fields: e.fields.map((f) => ({
//                     name: f.name,
//                     type: f.type,
//                     isPrimary: f.isPrimary,
//                     isForeign: f.isForeign,
//                     foreignTable: f.foreignTable,
//                     isRequired: f.isRequired,
//                     isUnique: f.isUnique,
//                     defaultValue: f.defaultValue,
//                   })),
//                   relations: e.relations,
//                 })),
//               }
//             : null,
//         }),
//       }),
//     [schema, sessionId]
//   );

//   const chat = useChat({
//     transport,
//   });

//   const { messages, sendMessage, setMessages } = chat;

//   // Initialize all tables as selected when schema loads
//   useEffect(() => {
//     if (schema) {
//       const allTables = new Set(schema.entities.map((e) => e.name));
//       setSelectedTables(allTables);

//       // Show success toast when schema is loaded
//       if (!uploadError) {
//         toast.success("Schema parsed successfully!");
//       }
//     }
//   }, [schema, uploadError]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setSelectedFile(file);
//       setPastedContent(""); // Clear paste area
//     }
//   };

//   const handleUpload = async (contentOverride?: string, fileName?: string) => {
//     let content = "";
//     if (contentOverride) {
//       content = contentOverride;
//     } else if (selectedFile) {
//       content = await selectedFile.text();
//     } else if (pastedContent.trim()) {
//       content = pastedContent;
//     } else {
//       setUploadError("Please upload a file or paste schema content");
//       return;
//     }

//     setIsUploading(true);
//     setUploadError(null);
//     const uploadMessage: any = {
//       id: Date.now().toString(),
//       role: "user",
//       content: fileName
//         ? `Uploaded file: ${fileName}`
//         : content.length > 200
//         ? content.slice(0, 200) + "..."
//         : content,
//       parts: [
//         {
//           type: "text",
//           text: fileName ? `Uploaded file: ${fileName}` : content,
//         },
//       ],
//     };
//     setMessages((prev) => [...prev, uploadMessage]);

//     try {
//       const maxRetries = 3;
//       let lastError: Error | null = null;

//       for (let attempt = 0; attempt < maxRetries; attempt++) {
//         try {
//           const response = await fetch("/api/upload", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ schemaContent: content }),
//           });

//           if (response.status === 503) {
//             // Service unavailable - retry with backoff
//             if (attempt < maxRetries - 1) {
//               const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
//               console.log(
//                 `Service unavailable, retrying in ${delay}ms (attempt ${
//                   attempt + 1
//                 }/${maxRetries})`
//               );
//               await new Promise((resolve) => setTimeout(resolve, delay));
//               continue; // Retry
//             }
//             throw new Error(
//               "Service temporarily unavailable. Please try again later."
//             );
//           }

//           if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.error || "Upload failed");
//           }

//           const data = await response.json();

//           if (data.success) {
//             setSessionId(data.sessionId);
//             setSchema(data.ermodel);
//             setNodes(data.nodes);
//             setEdges(data.edges);
//             setUploadError(null);
//             const successMessage: any = {
//               id: (Date.now() + 1).toString(),
//               role: "assistant",
//               content: `I've successfully parsed your schema! I found ${data.ermodel.entities.length} tables. The ER diagram has been generated. What would you like to know?`,
//               parts: [
//                 {
//                   type: "text",
//                   text: `I've successfully parsed your schema! I found ${data.ermodel.entities.length} tables. The ER diagram has been generated. What would you like to know?`,
//                 },
//               ],
//             };
//             setMessages((prev) => [...prev, successMessage]);
//             return; // Success - exit retry loop
//           } else {
//             throw new Error(data.error || "Failed to parse schema");
//           }
//         } catch (err) {
//           lastError = err instanceof Error ? err : new Error(String(err));
//           if (attempt === maxRetries - 1) {
//             throw lastError; // Last attempt failed, throw error
//           }
//         }
//       }
//     } catch (error: unknown) {
//       setUploadError(
//         error instanceof Error ? error.message : "An error occurred"
//       );
//       const errorMessage: any = {
//         id: (Date.now() + 1).toString(),
//         role: "assistant",
//         content: `Failed to parse schema: ${
//           error instanceof Error ? error.message : "Unknown error"
//         }`,
//         parts: [
//           {
//             type: "text",
//             text: `Failed to parse schema: ${
//               error instanceof Error ? error.message : "Unknown error"
//             }`,
//           },
//         ],
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleChatSubmit = async (e?: React.FormEvent) => {
//     if (e) e.preventDefault();
//     const message = chatInput.trim();
//     if (selectedFile) {
//       setChatInput("");
//       const fileName = selectedFile.name;
//       await handleUpload(undefined, fileName);
//       setSelectedFile(null);
//       return;
//     }

//     if (!message) return;

//     // Detect schema keywords to differentiate schema upload from chat queries
//     const schemaKeywords = [
//       "create table",
//       "search_path",
//       "primary key",
//       "foreign key",
//       "defineTable",
//       "defineSchema", // Convex
//       "new mongoose.Schema",
//       "new Schema", // Mongoose
//       "@id",
//       "@relation",
//       "@default", // Prisma
//       "model ",
//       "enum ",
//       "interface ", // Prisma/TS
//       "gorm.Model", // Gorm
//     ];
//     const hasSchemaKeywords = schemaKeywords.some((keyword) =>
//       message.toLowerCase().includes(keyword.toLowerCase())
//     );
//     const isSchema = hasSchemaKeywords && message.length > 30; // Avoid treating short queries as schema

//     if (isSchema) {
//       setChatInput("");
//       await handleUpload(message);
//     } else {
//       setChatInput("");
//       sendMessage({
//         parts: [{ type: "text", text: message }],
//       });
//     }
//   };

//   const handleClearSchema = () => {
//     setSchema(null);
//     setSessionId(null);
//     setPastedContent("");
//     setChatInput("");
//     setUploadError(null);
//     window.location.reload();
//   };

//   const onConnect = useCallback(
//     (params: Connection) => setEdges((eds) => addEdge(params, eds)),
//     [setEdges]
//   );

//   const handleExport = async () => {
//     try {
//       await downloadAsPNG("react-flow-container", "schema-diagram.png");
//     } catch (error: unknown) {
//       console.error("Export failed:", error);
//       alert("Failed to export diagram. Please try again.");
//     }
//   };

//   const toggleTableSelection = (tableName: string) => {
//     setSelectedTables((prev) => {
//       const next = new Set(prev);
//       if (next.has(tableName)) {
//         next.delete(tableName);
//       } else {
//         next.add(tableName);
//       }
//       return next;
//     });
//   };

//   const toggleTableExpansion = (tableName: string) => {
//     setExpandedTables((prev) => {
//       const next = new Set(prev);
//       if (next.has(tableName)) {
//         next.delete(tableName);
//       } else {
//         next.add(tableName);
//       }
//       return next;
//     });
//   };

//   const filteredEntities = schema?.entities.filter((entity) =>
//     entity.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <>
//       <Toaster position="top-right" />
//       <div className="flex h-[calc(100vh-60px)]  overflow-hidden">
//         {/* Left Panel - AI Assistant */}
//         <aside
//           className={cn(
//             "border-r border-border flex flex-col relative shrink-0 p-0 bg-white dark:bg-muted/70",
//             isResizing && "select-none"
//           )}
//           style={{ width: sidebarWidth }}
//         >
//           <div
//             className={cn(
//               "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 z-50 transition-colors select-none",
//               isResizing && "bg-primary/40"
//             )}
//             onMouseDown={startResizing}
//             onDoubleClick={(e) => e.preventDefault()}
//           />
//           {/* HEADER */}
//           <div className="border-b border-border py-3 px-6 flex items-center justify-between">
//             <div>
//               <h2 className="text-lg font-semibold flex items-center gap-2">
//                 <Bot className="w-6 h-6" />
//                 ER Agent
//               </h2>
//               {schema && (
//                 <p className="text-xs text-muted-foreground mt-1">
//                   {schema.entities.length} tables loaded
//                 </p>
//               )}
//             </div>
//             {schema && (
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handleClearSchema}
//                 className="gap-1.5 text-xs"
//                 title="Clear schema and start over"
//               >
//                 <X className="w-3.5 h-3.5" />
//                 Clear
//               </Button>
//             )}
//           </div>

//           {/* CHAT SECTION - Schema Assistant */}
//           <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
//             {/* Messages - AI Elements (Scrollable) */}
//             <Conversation className="flex-1 min-h-0">
//               <ConversationContent>
//                 {messages.length === 0 && !isUploading ? (
//                   <ConversationEmptyState>
//                     <div
//                       className={cn(
//                         "flex flex-col items-center justify-center text-center transition-all duration-300",
//                         sidebarWidth < 340 ? "" : ""
//                       )}
//                     >
//                       <div
//                         className={cn(
//                           "bg-primary/10 rounded-full mb-6 transition-all",
//                           sidebarWidth < 340 ? "p-3" : "p-4"
//                         )}
//                       >
//                         <Bot
//                           className={cn(
//                             "text-primary transition-all",
//                             sidebarWidth < 340 ? "w-8 h-8" : "w-12 h-12"
//                           )}
//                         />
//                       </div>
//                       <p
//                         className={cn(
//                           "text-muted-foreground max-w-md mb-8 transition-all",
//                           sidebarWidth < 340 ? "text-xs" : "text-sm"
//                         )}
//                       >
//                         Convert your database schemas into clean,
//                         easy-to-understand ER diagrams — no manual work, no
//                         guesswork.
//                       </p>

//                       <p
//                         className={cn(
//                           "mt-8 font-medium text-muted-foreground animate-pulse transition-all",
//                           sidebarWidth < 340 ? "text-xs" : "text-sm"
//                         )}
//                       >
//                         When you’re ready, drop your schema below ⬇️
//                       </p>
//                     </div>
//                   </ConversationEmptyState>
//                 ) : (
//                   <>
//                     {/* Uploading indicator */}
//                     {isUploading && (
//                       <div className="flex gap-2 items-center mb-4">
//                         <Loader2 className="w-4 h-4 animate-spin" />
//                         <span className="text-xs text-muted-foreground">
//                           🔄 Parsing your schema...
//                         </span>
//                       </div>
//                     )}

//                     {messages.map((message) => {
//                       if (message.role === "system") return null;
//                       return (
//                         <Message key={message.id} from={message.role} className="">
//                           <MessageContent>
//                             {message.parts?.map((part, i) => {
//                               switch (part.type) {
//                                 case "text":
//                                   return (
//                                     <MessageResponse
//                                     className=""
//                                       key={`${message.id}-${i}`}
//                                       // role={message.role as "user" | "assistant"}
//                                     >
//                                       {part.text}
//                                     </MessageResponse>
//                                   );
//                                 case "reasoning":
//                                   return (
//                                     <Reasoning
//                                       key={`${message.id}-${i}`}
//                                       className="w-full mb-4"
//                                       isStreaming={
//                                         i === message.parts.length - 1 &&
//                                         message.id === messages.at(-1)?.id
//                                       }
//                                     >
//                                       <ReasoningTrigger />
//                                       <ReasoningContent>
//                                         {part.text}
//                                       </ReasoningContent>
//                                     </Reasoning>
//                                   );
//                                 default:
//                                   return null;
//                               }
//                             })}
//                           </MessageContent>
//                         </Message>
//                       );
//                     })}
//                   </>
//                 )}
//               </ConversationContent>
//               <ConversationScrollButton />
//             </Conversation>
//             <div className="p-3 border-t border-border">
             

//               {/* Status Messages */}
//               {uploadError && (
//                 <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-3">
//                   {uploadError}
//                 </div>
//               )}

//               {/* Input Area - Unified Chat */}
//               <div className="space-y-2">
//                 {/* File Selection Indicator */}
//                 {selectedFile && (
//                   <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md border border-border text-xs animate-in fade-in slide-in-from-bottom-2">
//                     <FileText className="w-4 h-4 text-primary shrink-0" />
//                     <span className="truncate font-medium max-w-[200px]">
//                       {selectedFile.name}
//                     </span>
//                     <span className="text-muted-foreground ml-1">
//                       ({(selectedFile.size / 1024).toFixed(1)} KB)
//                     </span>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="h-5 w-5 ml-auto hover:bg-destructive/20 hover:text-destructive rounded-full"
//                       onClick={() => setSelectedFile(null)}
//                     >
//                       <X className="w-3 h-3" />
//                     </Button>
//                   </div>
//                 )}

//                 <div className="relative">
//                   <input
//                     type="file"
//                     id="file-upload"
//                     className="hidden"
//                     onChange={handleFileChange}
//                     accept=".sql,.prisma,.json,.ts,.js,.txt,.md,.csv"
//                   />

//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="absolute left-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-foreground hover:!bg-transparent z-10"
//                     onClick={() =>
//                       document.getElementById("file-upload")?.click()
//                     }
//                     disabled={isUploading}
//                     title="Attach schema file"
//                   >
//                     <Paperclip className="w-4 h-4" />
//                   </Button>

//                   <Textarea
//                     value={chatInput}
//                     onChange={(e) => {
//                       setChatInput(e.target.value);
//                       e.target.style.height = "auto";
//                       e.target.style.height =
//                         Math.min(e.target.scrollHeight, 200) + "px";
//                     }}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter" && !e.shiftKey) {
//                         e.preventDefault();
//                         if (chatInput.trim() || selectedFile) {
//                           handleChatSubmit(e);
//                         }
//                       }
//                     }}
//                     placeholder="Paste your schema or ask a question..."
//                     disabled={isUploading}
//                     rows={1}
//                     className="min-h-[44px] max-h-[200px] resize-none font-mono text-sm pl-12 pr-12 overflow-hidden focus-visible:ring-0 focus-visible:outline-none"
//                   />

//                   {/* Inline Send Button */}
//                   <Button
//                     onClick={handleChatSubmit}
//                     disabled={
//                       isUploading || (!chatInput.trim() && !selectedFile)
//                     }
//                     size="icon"
//                     className="absolute right-2 bottom-2 h-8 w-8"
//                   >
//                     {isUploading ? (
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                     ) : (
//                       <Send className="w-4 h-4" />
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* Center Panel - ER Diagram */}
//         <main className="flex-1 relative flex flex-col ">
//           {/* Header Bar */}
//           <div className=" border-b border-border  px-5 py-3 flex items-center justify-between shrink-0">
//             <div>
//               <h1 className="text-lg font-bold">Schema ER Diagram</h1>
//               {schema && (
//                 <p className="text-xs text-muted-foreground">
//                   {nodes.length} tables • {edges.length} relations
//                 </p>
//               )}
//             </div>

//             <div className="flex items-center gap-2">
//               <Button
//                 onClick={handleExport}
//                 disabled={!schema}
//                 size="sm"
//                 variant="default"
//               >
//                 <Download className="w-4 h-4 mr-2" />
//                 Export PNG
//               </Button>
//               <Button
//                 variant="outline"
//                 size="icon"
//                 onClick={() => setIsSchemaOpen(!isSchemaOpen)}
//                 className="cursor-pointer"
//               >
//                 <PanelRight className="h-5 w-5 " />
//               </Button>
//             </div>
//           </div>

//           {/* React Flow Diagram */}
//           <div className="flex-1 relative" id="react-flow-container">
//             {schema ? (
//               <ReactFlow
//                 nodes={nodes}
//                 edges={edges}
//                 onNodesChange={onNodesChange}
//                 onEdgesChange={onEdgesChange}
//                 onConnect={onConnect}
//                 nodeTypes={nodeTypes}
//                 fitView
//                 minZoom={0.1}
//                 maxZoom={2}
//                 defaultEdgeOptions={{
//                   animated: true,
//                   style: { strokeWidth: 2, strokeDasharray: "5,5" },
//                 }}
//               >
//                 {/* <Controls position="bottom-left" />
//                 <MiniMap
//                   position="bottom-right"
//                   nodeStrokeWidth={3}
//                   zoomable
//                   pannable
//                 /> */}
//                 <Background
//                   variant={BackgroundVariant.Dots}
//                   gap={16}
//                   size={1}
//                 />
//               </ReactFlow>
//             ) : (
//               <div className="flex items-center justify-center h-full text-muted-foreground">
//                 <div className="text-center space-y-2">
//                   <Upload className="w-12 h-12 mx-auto opacity-50" />
//                   <p className="text-sm">Upload a schema to get started</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </main>

//         {/* Right Panel - Schema Explorer */}
//         <aside
//           className={cn(
//             "border-l border-border dark:bg-muted/70 bg-white flex flex-col overflow-hidden transition-all duration-300 animate-collapsible-down ease-in-out",
//             isSchemaOpen ? "w-72" : "w-0 border-0"
//           )}
//         >
//           <div className="p-4 border-b border-border">
//             <h2 className="text-sm font-semibold mb-3">Schema Explorer</h2>

//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search tables..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-8 text-sm"
//               />
//             </div>

//             {schema && (
//               <p className="text-xs text-muted-foreground mt-2">
//                 {filteredEntities?.length || 0} of {schema.entities.length}{" "}
//                 tables
//               </p>
//             )}
//           </div>

//           {/* Tables List */}
//           <div className="flex-1 overflow-y-auto">
//             {filteredEntities && filteredEntities.length > 0 ? (
//               <div className="p-3 space-y-2">
//                 {filteredEntities.map((entity) => (
//                   <Card key={entity.name} className="overflow-hidden">
//                     {/* Table Header */}
//                     <CardHeader className="p-3 pb-2">
//                       <div className="flex items-center justify-between">
//                         <label className="flex items-center gap-2 cursor-pointer flex-1">
//                           <input
//                             type="checkbox"
//                             checked={selectedTables.has(entity.name)}
//                             onChange={() => toggleTableSelection(entity.name)}
//                             className="w-4 h-4 rounded border-border"
//                           />
//                           <span className="text-sm font-medium truncate">
//                             {entity.name}
//                           </span>
//                         </label>

//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-6 w-6 shrink-0"
//                           onClick={() => toggleTableExpansion(entity.name)}
//                         >
//                           {expandedTables.has(entity.name) ? (
//                             <ChevronDown className="w-3 h-3" />
//                           ) : (
//                             <ChevronRight className="w-3 h-3" />
//                           )}
//                         </Button>
//                       </div>
//                     </CardHeader>

//                     {/* Expanded Fields */}
//                     {expandedTables.has(entity.name) && (
//                       <>
//                         <Separator />
//                         <CardContent className="p-3 pt-2 space-y-1">
//                           {entity.fields.map((field, idx) => (
//                             <div
//                               key={idx}
//                               className="flex items-center gap-2 text-xs"
//                             >
//                               {field.isPrimary && (
//                                 <Badge
//                                   variant="secondary"
//                                   className="h-4 px-1 text-[9px]"
//                                 >
//                                   🔑
//                                 </Badge>
//                               )}
//                               {field.isForeign && (
//                                 <Badge
//                                   variant="secondary"
//                                   className="h-4 px-1 text-[9px]"
//                                 >
//                                   🔗
//                                 </Badge>
//                               )}
//                               <span className="font-medium">{field.name}</span>
//                               <span className="text-muted-foreground text-[10px] ml-auto">
//                                 {field.type}
//                               </span>
//                             </div>
//                           ))}
//                           <Separator className="my-2" />
//                           <div className="text-[10px] text-muted-foreground">
//                             {entity.relations.length} relation
//                             {entity.relations.length !== 1 ? "s" : ""}
//                           </div>
//                         </CardContent>
//                       </>
//                     )}
//                   </Card>
//                 ))}
//               </div>
//             ) : schema ? (
//               <div className="text-center text-muted-foreground text-sm py-8">
//                 No tables match your search
//               </div>
//             ) : (
//               <div className="text-center text-muted-foreground text-sm py-8">
//                 Upload a schema to explore tables
//               </div>
//             )}
//           </div>
//         </aside>
//       </div>
//     </>
//   );
// }
