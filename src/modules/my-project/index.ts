"use server";

import { Doc } from "../../../convex/_generated/dataModel";
import { getProjectHealthData, getProjectLanguages } from "../github/action";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

type ActivityInput = {
  commitsLast60Days: number | null;
  totalPRs: number | null;
  mergedPRs: number | null;
  prMergeRate: number | null; // 0–1 or 0–100 (we’ll normalize)
  lastCommitDate: string | null; // ISO string
};


// ===========================================
// Function to calculate activity momentum score (0-35)
// ===========================================
export async function calculateActivityMomentumScore({
  commitsLast60Days,
  totalPRs,
  mergedPRs,
  prMergeRate,
  lastCommitDate,
}: ActivityInput): Promise<number> {
  let score = 0;

  /* ---------------------------
     1. Commit Velocity (0–15)
  ----------------------------*/
  const commits = commitsLast60Days ?? 0;

  if (commits >= 20) score += 15;
  else if (commits >= 10) score += 10;
  else if (commits > 0) score += 5;
  else score += 0;

  /* ---------------------------
     2. PR Activity & Merge (0–10)
  ----------------------------*/
  const total = totalPRs ?? 0;
  const merged = mergedPRs ?? 0;

  let mergeRatio = prMergeRate ?? 0;

  // Normalize merge rate if it comes as %
  if (mergeRatio > 1) mergeRatio = mergeRatio / 100;

  if (total > 0) {
    if (merged >= 10 && mergeRatio >= 0.6) score += 10;
    else if (merged >= 5 && mergeRatio >= 0.4) score += 7;
    else if (merged > 0) score += 4;
    else score += 1;
  }

  /* ---------------------------
     3. Recency / Decay (0–10)
  ----------------------------*/
  if (lastCommitDate) {
    const lastCommit = new Date(lastCommitDate).getTime();
    const now = Date.now();
    const daysAgo = Math.floor((now - lastCommit) / (1000 * 60 * 60 * 24));

    if (daysAgo <= 7) score += 10;        // very good
    else if (daysAgo <= 14) score += 8;   // good
    else if (daysAgo <= 30) score += 5;   // okay
    else if (daysAgo <= 60) score += 2;   // decay
    else score += 0;                      // inactive
  }

  /* ---------------------------
     Final Clamp (0–35)
  ----------------------------*/
  return Math.max(0, Math.min(35, score));
}

// ===========================================
// COMMUNITY TRUST HEALTH SCORE (0-20)
// ===========================================
type CommunityTrustInput = {
  projectStars: number | null;
  projectForks: number | null;
  projectUpvotes: number | null;
};

export async function calculateCommunityTrustScore({
  projectStars,
  projectForks,
  projectUpvotes,
}: CommunityTrustInput): Promise<number> {
  const stars = projectStars ?? 0;
  const forks = projectForks ?? 0;
  const upvotes = projectUpvotes ?? 0;

  // Log scaling to avoid inflation
  const starScore = Math.log10(stars + 1) * 4;    // max ~6
  const forkScore = Math.log10(forks + 1) * 3;    // max ~4
  const upvoteScore = Math.log10(upvotes + 1) * 7; // max ~10

  const rawScore = starScore + forkScore + upvoteScore;

  // Normalize to 0–20
  return Math.max(0, Math.min(20, Math.round(rawScore)));
}

// ==========================================
// CALCULATE FRESHNESS SCORE HEATH SCORE
// ===========================================
type FreshnessInput = {
  lastCommitDate: string | null; // ISO string
  commitsLast60Days: number | null;
};

export async function calculateFreshnessScore({
  lastCommitDate,
  commitsLast60Days,
}: FreshnessInput): Promise<number> {
  if (!lastCommitDate) return 0;

  const commits = commitsLast60Days ?? 0;
  const lastCommit = new Date(lastCommitDate).getTime();
  const now = Date.now();

  const daysAgo = Math.floor((now - lastCommit) / (1000 * 60 * 60 * 24));

  let score = 0;

  // Recency (primary signal)
  if (daysAgo <= 7) score += 6;        // very fresh
  else if (daysAgo <= 14) score += 5;  // fresh
  else if (daysAgo <= 30) score += 3;  // okay
  else if (daysAgo <= 60) score += 1;  // stale
  else score += 0;                     // inactive

  // Velocity boost (secondary)
  if (commits >= 20) score += 4;
  else if (commits >= 10) score += 3;
  else if (commits > 0) score += 1;

  return Math.max(0, Math.min(10, score));
}

// ==========================================
// maintenanceQuality (0–35) SCORE AI 
// ===========================================
export async function calculateMaintenanceQualityScore(
  description: string,
  about: string,
  tags: string[],
  languages: string[]
): Promise<number> {
  try {
    const chat = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
    });

    const prompt = `
      You are an expert software quality auditor. Evaluate the "Maintenance Quality" of a software project based on the following metadata.
      
      Project Description: "${description}"
      About/README content length: ${about.length} characters
      Tags: ${tags.join(", ")}
      Languages: ${languages.join(", ")}

      Criteria (Total 35 points):
      1. Documentation presence (Is there a description? Is the README substantial?): 0-15 pts
      2. Tech Stack Clarity (Are languages and tags consistent and standard?): 0-10 pts
      3. Project Metadata Completeness (Are fields filled out?): 0-10 pts

      Return ONLY a single integer number between 0 and 35 representing the score. Do not provide any explanation or text.
    `;

    const response = await chat.invoke(prompt);
    console.log("response score from AI", response.content);
    
    // Ensure we parse a number
    const content = response.content.toString().trim();
    const score = parseInt(content, 10);
    console.log("score from AI after parsing...", score);

    if (isNaN(score)) return 0;
    return Math.max(0, Math.min(35, score));
  } catch (error) {
    console.error("Error calculating maintenance quality score:", error);
    return 0; // Default to 0 on error
  }
}

// ===========================================
// Function to get the all stats to calculate project health score
// ===========================================
export const getProjectHealthScore = async (project: Doc<"projects">) => {
  console.log("Health Score Calculation Started for:", project.projectName);

  // 1. Fetch live activity data from GitHub
  const healthData = await getProjectHealthData(project.repoOwner, project.repoName);
  const languagesData = await getProjectLanguages(project.repoOwner, project.repoName);

  // 2. Extract metrics (safe defaults)
  const velocity60Days = healthData?.commitsLast60Days ?? 0;
  const lastCommitDate = healthData?.lastCommitDate ?? null;
  const prMergeRate = healthData?.prMergeRate ?? 0;
  const totalPr = healthData?.totalPRs ?? 0;
  const mergedPr = healthData?.mergedPRs ?? 0;

  const projectAbout = project.about || "no about (readme/docs) provided by user yet";
  const projectTags = project.tags || [];
  const projectLanguages = languagesData?.map((lang) => lang.name) ?? [];
  const projectStars = project.projectStars ?? 0;
  const projectForks = project.projectForks ?? 0; 
  const projectUpvotes = project.projectUpvotes ?? 0;
  const projectDescription = project.description || "no description provided by user yet";

  console.log("Metrics extracted:", {
    velocity60Days,
    lastCommitDate,
    prMergeRate,
    projectStars,
  });

  // 3. Calculate Component Scores
  const activityMomentum = await calculateActivityMomentumScore({
    commitsLast60Days: velocity60Days,
    totalPRs: totalPr,
    mergedPRs: mergedPr,
    prMergeRate: prMergeRate,
    lastCommitDate: lastCommitDate,
  });
  console.log("Activity Momentum:", activityMomentum);

  const communityTrust = await calculateCommunityTrustScore({
    projectStars: projectStars,
    projectForks: projectForks,
    projectUpvotes: projectUpvotes,
  });
  console.log("Community Trust:", communityTrust);

  const freshness = await calculateFreshnessScore({
    lastCommitDate: lastCommitDate,
    commitsLast60Days: velocity60Days,
  });
  console.log("Freshness:", freshness);

  const maintenanceQuality = await calculateMaintenanceQualityScore(
    projectDescription,
    projectAbout,
    projectTags,
    projectLanguages
  );
  console.log("Maintenance Quality (AI):", maintenanceQuality);

  // 4. Aggregate Total
  const totalScore = activityMomentum + communityTrust + freshness + maintenanceQuality;
  const finalTotal = Math.max(0, Math.min(100, Math.round(totalScore)));
  console.log("Final Calculated Score:", finalTotal);

  // 5. Construct Health Object
  const previousScores = project.healthScore?.previousScores || [];
  
  const newHistoryEntry = {
    totalScore: finalTotal,
    calculatedDate: new Date().toISOString().split("T")[0],
  };

  // Keep latest 2
  const updatedHistory = [newHistoryEntry, ...previousScores].slice(0, 2);

  return {
    totalScore: finalTotal,
    activityMomentum,
    maintenanceQuality,
    communityTrust,
    freshness,
    lastCalculatedDate: new Date().toISOString().split("T")[0],
    previousScores: updatedHistory,
  };
};

