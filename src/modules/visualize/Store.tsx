"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
  Handle,
  Position,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ExternalLink,
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Layout,
  AlertCircle,
  CheckCircle2,
  Activity,
  Eye,
} from "lucide-react";

import { generateRepoVisualization } from "./index";
import { LuLightbulb, LuX } from "react-icons/lu";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import dagre from "dagre";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 160;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function FolderNode({ data }: any) {
  const isRoot = data.level === 0;
  const { isCollapsible, isCollapsed, onToggleCollapse, issueStatus, fileCount } = data;

  const getFolderColor = (): string => {
    const isActive = issueStatus === "pending" || issueStatus === "assigned" || issueStatus === "ignored";
    if (isActive) return "#ef4444"; // Red for active issues
    if (fileCount >= 8) return "#f59e0b"; // Yellow for high changes (>= 8)
    return "#3b82f6"; // Blue for normal
  };

  const color = getFolderColor();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className="group relative"
      style={{
        width: "280px",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5! w-2.5! border-2! border-white!"
        style={{ background: color }}
      />

      <div
        className="overflow-hidden rounded-xl border bg-card p-1 shadow-sm transition-all hover:shadow-md"
        style={{
          borderColor: (issueStatus || fileCount > 10) ? color : (isRoot ? "#6366f1" : "rgba(134, 165, 231, 0.3)"),
          borderWidth: (issueStatus || isRoot) ? "2px" : "1px",
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {isCollapsible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse?.();
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </button>
          )}

          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg relative"
            style={{ 
              backgroundColor: (issueStatus && issueStatus !== "resolved") ? "#ef4444" : `${color}15`,
              color: (issueStatus && issueStatus !== "resolved") ? "white" : color
            }}
          >
            {issueStatus === "pending" ? (
              <AlertCircle size={15} className="animate-pulse" />
            ) : issueStatus === "resolved" ? (
              <CheckCircle2 size={15} className="text-green-500" />
            ) : issueStatus === "assigned" || issueStatus === "ignored" ? (
              <Activity size={15} />
            ) : (
              <Folder size={15} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={`truncate text-sm font-semibold capitalize flex items-center gap-1.5 ${(issueStatus && issueStatus !== "resolved") ? "text-red-500" : ""}`}
              title={data.label}
            >
              {data.label}
              {issueStatus && (
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                  issueStatus === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {issueStatus}
                </span>
              )}
            </div>
          </div>

          {issueStatus && issueStatus !== "resolved" && (
            <div className="absolute -top-1 -right-1 z-20">
              <button
                className="h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
              >
                <Eye size={12} />
              </button>
              
              {showDetails && (
                <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border bg-popover p-2 text-[10px] shadow-xl animate-in fade-in zoom-in-95">
                  <div className="font-bold border-b pb-1 mb-1">Issue Overview</div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium uppercase text-red-500">{issueStatus}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="font-medium text-orange-500">High</span>
                  </div>
                  <div className="mt-1 pt-1 border-t text-muted-foreground italic">
                    Assignee and full details available in future update.
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              window.open(data.githubUrl, "_blank");
            }}
          >
            <ExternalLink size={14} />
          </button>
        </div>

        <Separator className="opacity-50" />

        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText size={12} />
              <span>{data.fileCount} changes</span>
            </div>
            {isCollapsed && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                collapsed
              </span>
            )}
          </div>

          <div className="truncate rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
            {data.path || "/"}
          </div>

          {data.fileCount > 0 && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (data.fileCount / 20) * 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5! w-2.5! border-2! border-white!"
        style={{ background: color }}
      />
    </div>
  );
}

export const nodeTypes = {
  custom: FolderNode,
};

interface RepoVisualizerProps {
  owner: string;
  repo: string;
}

export default function RepoVisualizer({ owner, repo }: RepoVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const { theme } = useTheme();

  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const repository = useQuery(api.repos.getRepoByName, { owner, name: repo });
  const issues = useQuery(api.repos.getIssuesByRepoId, {
    repoId: repository?._id as any,
  });

  // Store the FULL original edge list so collapse logic always has access
  const [allEdges, setAllEdges] = useState<Edge[]>([]);

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction,
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges],
  );

  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Load data once
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await generateRepoVisualization(owner, repo);

        if (!data.nodes || data.nodes.length === 0) {
          setError("No repository data found.");
          return;
        }

        const rawEdges = data.edges as Edge[];

        // Pre-compute which node IDs are parents (have children)
        const parentNodeIds = new Set<string>();
        rawEdges.forEach((edge) => parentNodeIds.add(edge.source));

        // Inject isCollapsible + onToggleCollapse into node data RIGHT AWAY
        const enrichedNodes = (data.nodes as Node[]).map((node) => ({
          ...node,
          data: {
            ...node.data,
            isCollapsible: parentNodeIds.has(node.id),
            isCollapsed: false,
            onToggleCollapse: () => toggleNodeCollapse(node.id),
          },
        }));

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(enrichedNodes, rawEdges, "TB");

        setAllEdges(rawEdges); // save full edges for collapse lookups
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (err) {
        console.error("Error loading visualization:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (owner && repo) {
      load();
    }
  }, [owner, repo]);

  // React to collapse changes OR issue updates
  useEffect(() => {
    if (allEdges.length === 0) return;

    setNodes((nds) =>
      nds.map((node) => {
        const isCollapsed = collapsedNodes.has(node.id);

        // Walk up ancestors using allEdges to check if any parent is collapsed
        let isHidden = false;
        let currentParent = allEdges.find(
          (e) => e.target === node.id,
        )?.source;
        while (currentParent) {
          if (collapsedNodes.has(currentParent)) {
            isHidden = true;
            break;
          }
          currentParent = allEdges.find(
            (e) => e.target === currentParent,
          )?.source;
        }

        // Enrich with issue data
        let nodeIssueStatus = undefined;
        if (issues) {
          const path = node.data.path;
          const relevantIssues = issues.filter(
            (issue) =>
              issue.issueFiles === path ||
              issue.issueFiles?.startsWith(path + "/"),
          );

          if (relevantIssues.length > 0) {
            // Find the most critical status
            const activeIssue = relevantIssues.find(
              (i) => i.issueStatus === "pending" || i.issueStatus === "assigned" || i.issueStatus === "ignored"
            );
            
            if (activeIssue) {
              nodeIssueStatus = activeIssue.issueStatus;
            } else {
              nodeIssueStatus = "resolved";
            }
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            isCollapsed,
            onToggleCollapse: () => toggleNodeCollapse(node.id),
            issueStatus: nodeIssueStatus,
          },
          hidden: isHidden,
        };
      }),
    );

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        hidden: collapsedNodes.has(edge.source),
      })),
    );
  }, [collapsedNodes, allEdges, toggleNodeCollapse, setNodes, setEdges, issues]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <Folder
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
              size={24}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Building Repository Tree</p>
            <p className="text-sm text-muted-foreground">
              Analyzing {owner}/{repo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LuX size={24} />
          </div>
          <h2 className="mb-2 text-xl font-bold">Failed to Load</h2>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-170px)] w-full overflow-hidden rounded-xl border bg-background shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />

        <Panel position="top-left" className="flex flex-col gap-2">
          <div className="rounded-lg border bg-card p-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Folder size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold leading-none">{repo}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{owner}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onLayout("TB")}
              className="flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <Layout size={14} /> Vertical
            </button>
            <button
              onClick={() => onLayout("LR")}
              className="flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <Layout size={14} className="rotate-90" /> Horizontal
            </button>
          </div>
        </Panel>

        <Panel position="top-right">
          {!guideOpen ? (
            <button
              onClick={() => setGuideOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-md transition-all hover:scale-105"
            >
              <LuLightbulb size={18} className="text-primary" />
            </button>
          ) : (
            <div className="w-64 animate-in fade-in slide-in-from-top-2 rounded-xl border bg-card p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <LuLightbulb className="text-primary" />
                  Tree Navigation
                </h3>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <LuX size={16} />
                </button>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                    1
                  </span>
                  <span>
                    Click <b>toggle icons</b> to expand or collapse folders
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                    2
                  </span>
                  <span>
                    <b>Scroll</b> to zoom, <b>Drag</b> to pan the view
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                    3
                  </span>
                  <span>
                    Click the <b>external link</b> to view on GitHub
                  </span>
                </li>
              </ul>
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
