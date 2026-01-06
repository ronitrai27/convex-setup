import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dagre from "dagre";
import { nanoid } from "nanoid";
import { toPng } from "html-to-image";
import type { ERModel, EntityNode, EntityEdge } from "@/types/ERmodel"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =======================================
//Generate unique session ID
//  ======================================
export function generateSessionId(): string {
  return nanoid(16);
}

// =======================================
//Convert ERModel to React Flow nodes and edges
// =======================================
export function ermodelToReactFlow(ermodel: ERModel): {
  nodes: EntityNode[];
  edges: EntityEdge[];
} {
  const nodes: EntityNode[] = ermodel.entities.map((entity, index) => ({
    id: entity.name,
    type: "entity",
    position: { x: index * 300, y: index * 150 },
    data: {
      label: entity.name,
      fields: entity.fields,
      relations: entity.relations,
      isHighlighted: false,
      isDimmed: false,
    },
  }));

  const edges: EntityEdge[] = [];
  const edgeMap = new Map<string, boolean>(); // Prevent duplicate edges

  ermodel.entities.forEach((entity: any) => {
    entity.relations.forEach((relation: any) => {
      const edgeId = `${relation.from}-${relation.to}`;
      const reverseEdgeId = `${relation.to}-${relation.from}`;

      // Skip if edge already exists
      if (edgeMap.has(edgeId) || edgeMap.has(reverseEdgeId)) return;

      edges.push({
        id: edgeId,
        source: relation.from,
        target: relation.to,
        label: relation.type,
        animated: true,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        labelStyle: { fill: "#64748b", fontWeight: 500, fontSize: 12 },
      });

      edgeMap.set(edgeId, true);
    });
  });

  return { nodes, edges };
}

// =======================================
//Apply Dagre layout algorithm to position nodes
// =======================================
export function applyDagreLayout(
  nodes: EntityNode[],
  edges: EntityEdge[],
  direction: "LR" | "TB" = "LR"
): {
  nodes: EntityNode[];
  edges: EntityEdge[];
} {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure layout
  dagreGraph.setGraph({
    rankdir: direction, // LR = Left to Right, TB = Top to Bottom
    align: "UL",
    nodesep: 150, // Horizontal spacing
    ranksep: 100, // Vertical spacing
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 250, // Approximate node width
      height: 150, // Approximate node height
    });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout algorithm
  dagre.layout(dagreGraph);

  // Apply calculated positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 125, // Center the node (width/2)
        y: nodeWithPosition.y - 75, // Center the node (height/2)
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// =======================================
//Download diagram as PNG
// =======================================
export async function downloadAsPNG(
  elementId: string,
  filename: string = "schema-diagram.png"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2, // Higher quality
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to export PNG:", error);
    throw new Error("Export failed. Please try again.");
  }
}
// =======================================
//Filter nodes based on selected tables
// =======================================
export function filterNodes(
  nodes: EntityNode[],
  selectedTables: Set<string>
): EntityNode[] {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isDimmed: !selectedTables.has(node.data.label),
    },
  }));
}
// =======================================
//Validate ERModel structure
// =======================================
export function validateERModel(ermodel: ERModel): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ermodel.entities || ermodel.entities.length === 0) {
    errors.push("No entities found in schema");
  }

  const entityNames = new Set<string>();
  ermodel.entities.forEach((entity: any) => {
    // Check for duplicate entity names
    if (entityNames.has(entity.name)) {
      errors.push(`Duplicate entity name: ${entity.name}`);
    }
    entityNames.add(entity.name);

    // Validate fields
    if (!entity.fields || entity.fields.length === 0) {
      errors.push(`Entity "${entity.name}" has no fields`);
    }

    // Validate relations (non-blocking - just warnings)
    entity.relations.forEach((relation: any) => {
      if (!entityNames.has(relation.to)) {
        warnings.push(
          `Relation from "${entity.name}" references non-existent entity "${relation.to}"`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}