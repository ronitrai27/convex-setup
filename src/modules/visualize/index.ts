"use server";

import { getFolderRiskHeatmap, getGithubAccessToken } from "../github/action";

export interface FolderRisk {
  path: string;
  name: string;
  filesChanged: number;
}

export async function analyzeRepoTree(
  owner: string,
  repo: string,
  branch: string = "main",
) {
  const token = await getGithubAccessToken();

  if (!token) {
    throw new Error("GITHUB_TOKEN not found.");
  }

  const risks = await getFolderRiskHeatmap(token, owner, repo, branch);
  console.log("================tree Risk--------->", risks);

  return risks;
}

export async function generateRepoVisualization(
  owner: string,
  repo: string,
  branch: string = "main",
) {
  const risks = await analyzeRepoTree(owner, repo, branch);

  const nodes: any[] = [];
  const edges: any[] = [];
  const folderMap = new Map<string, any>();

  // Use a root node
  const rootId = "root";
  folderMap.set("", {
    id: rootId,
    label: repo,
    path: "",
    fileCount: 0,
    githubUrl: `https://github.com/${owner}/${repo}`,
    level: 0,
  });

  // Helper to ensure all parent folders exist
  const getOrCreateNode = (path: string): any => {
    if (folderMap.has(path)) return folderMap.get(path);

    const parts = path.split("/");
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");

    const parentNode = getOrCreateNode(parentPath);
    const id = path;
    const level = parts.length;

    const node = {
      id,
      label: name,
      path,
      fileCount: 0,
      githubUrl: `https://github.com/${owner}/${repo}/tree/${branch}/${path}`,
      level,
    };

    folderMap.set(path, node);

    edges.push({
      id: `e-${parentNode.id}-${id}`,
      source: parentNode.id,
      target: id,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#86A5E7", strokeWidth: 2 },
    });

    return node;
  };

  risks.forEach((risk) => {
    const node = getOrCreateNode(risk.path);
    node.fileCount = risk.filesChanged;
  });

  // Convert map to nodes array
  folderMap.forEach((node) => {
    nodes.push({
      id: node.id,
      type: "custom",
      data: node,
      position: { x: 0, y: 0 }, // Will be set by layout on client
    });
  });

  return { nodes, edges };
}
