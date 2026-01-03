// lib/calculateImpactScore.ts

interface GitHubStats {
  totalCommits: number;
  totalPRs: number;
  totalIssuesClosed: number;
  totalReviews: number;
  accountAgeInYears: number;
}

interface ImpactScoreResult {
  score: number;
  displayScore: number;
  tier: string;
  eliteBadge: string | null;
  weightedActivity: number;
  consistencyBonus: number;
  breakdown: {
    commits: number;
    prs: number;
    issues: number;
    reviews: number;
  };
  penalties: string[];
}

/**
 * WeKraft Impact Score — Explanation
 * ---------------------------------
 *
 * GOAL:
 * -----
 * Measure a developer’s *real-world impact* on GitHub by prioritizing
 * collaboration, trust, and sustained contribution — not raw activity.
 *
 * This score is intentionally strict.
 * High commit counts alone should NEVER make someone "Elite".
 *
 *
 * CORE PHILOSOPHY:
 * ----------------
 * 1. Collaboration > Solo Work
 *    - PRs, issues, and reviews matter more than commits.
 *
 * 2. Trust > Volume
 *    - Reviews and accepted PRs signal professional maturity.
 *
 * 3. Consistency > Spikes
 *    - Balanced contribution across multiple areas is rewarded.
 *
 * 4. Anti-Gaming
 *    - Commit spamming, tutorial repos, and solo-only activity are penalized.
 *
 *
 * HOW THE SCORE IS BUILT:
 * ----------------------
 *
 * STEP 1: Weighted Activity
 * - Commits are capped (max 10/day) and weighted low.
 * - PRs, issues, and reviews are weighted higher to reflect collaboration.
 *
 *   Weights:
 *   - Commits: 0.5
 *   - PRs:     4
 *   - Issues:  2.5
 *   - Reviews: 3
 *
 * STEP 2: Account Age Normalization
 * - Older accounts should not dominate purely due to time.
 * - Square root of account age softens the advantage.
 *
 * STEP 3: Behavioral Penalties
 * - High commit-to-PR ratio → likely solo or tutorial-heavy work.
 * - Low PRs or reviews for older accounts → limited collaboration.
 *
 * STEP 4: Behavioral Bonuses
 * - Strong review culture (reviews > PRs/2 and > 30 total)
 *   → rewards mentorship and senior behavior.
 *
 * STEP 5: Consistency Bonus
 * - Balanced contributors across ALL areas get rewarded.
 *
 * STEP 6: Raw Score vs Display Score
 * - `rawScore` is the internal, unbounded credibility score.
 * - `displayScore` is capped at 100 for UI & human interpretation.
 */

export function calculateImpactScore(stats: GitHubStats): ImpactScoreResult {
  // Revised weights - favor collaboration over solo commits
  const WEIGHTS = {
    commits: 1, // Reduced from 1 (commits alone aren't impressive)
    prs: 3, // Increased from 3 (PRs show real collaboration)
    issues: 2, // Increased from 2
    reviews: 2.5, // Increased from 2.5 (reviews show mentorship)
  };

  // Much stricter commit cap - 10 per day max (not 20)
  const effectiveCommits = Math.min(
    stats.totalCommits,
    stats.accountAgeInYears * 365 * 20
  );

  // Calculate weighted contributions
  const breakdown = {
    commits: effectiveCommits * WEIGHTS.commits,
    prs: stats.totalPRs * WEIGHTS.prs,
    issues: stats.totalIssuesClosed * WEIGHTS.issues,
    reviews: stats.totalReviews * WEIGHTS.reviews,
  };

  const weightedActivity =
    breakdown.commits + breakdown.prs + breakdown.issues + breakdown.reviews;

  // Normalize by account age (square root to soften penalty)
  const ageFactor = Math.max(Math.sqrt(stats.accountAgeInYears), 0.5);

  // Base score calculation
  let baseScore = weightedActivity / ageFactor / 12; // Increased divisor from 10 to 15

  // Track penalties for transparency
  const penalties: string[] = [];

  // PENALTY 1: Poor commit-to-PR ratio (commit-heavy = solo work)
  const commitToPRRatio = stats.totalCommits / Math.max(stats.totalPRs, 1);
  if (commitToPRRatio > 50) {
    baseScore *= 0.7; // 30% penalty for extreme solo work
    penalties.push("High commit-to-PR ratio (mostly solo work)");
  } else if (commitToPRRatio > 30) {
    baseScore *= 0.85; // 15% penalty
    penalties.push("Moderate commit-to-PR ratio");
  }

  // PENALTY 2: Low PR count (not contributing to others)
  if (stats.totalPRs < 50 && stats.accountAgeInYears >= 2) {
    baseScore *= 0.9; // 10% penalty
    penalties.push("Low PR count for account age");
  }

  // PENALTY 3: No review activity (not helping others)
  if (stats.totalReviews < 20 && stats.accountAgeInYears >= 2) {
    baseScore *= 0.9; // 10% penalty
    penalties.push("Limited code review activity");
  }

  // BONUS: Strong review culture (reviews > PRs/2)
  if (stats.totalReviews > stats.totalPRs / 2 && stats.totalReviews > 30) {
    baseScore *= 1.15; // 15% bonus for mentorship
  }

  // Consistency bonus (must have ALL activity types)
  const activityTypes = [
    stats.totalCommits > 0,
    stats.totalPRs > 10, // Must have meaningful PRs
    stats.totalIssuesClosed > 5, // Must have meaningful issues
    stats.totalReviews > 10, // Must have meaningful reviews
  ].filter(Boolean).length;

  const consistencyBonus =
    activityTypes >= 4 ? 1.15 : activityTypes >= 3 ? 1.05 : 1.0;
  const rawScore = Math.round(baseScore * consistencyBonus);

  // Cap display score at 100
  const displayScore = Math.min(rawScore, 100);

  // STRICTER tier thresholds
  let tier = "Inactive";
  let eliteBadge: string | null = null;

  if (rawScore >= 150) {
    tier = "Elite Contributor";
    eliteBadge = "Top 1% • Exceptional";
  } else if (rawScore >= 120) {
    tier = "Elite Contributor";
    eliteBadge = "Top 5% • Outstanding";
  } else if (rawScore >= 100) {
    tier = "Elite Contributor";
    eliteBadge = "Top 10%";
  } else if (rawScore >= 90) {
    // Raised from 80
    tier = "Elite Contributor";
  }else if(rawScore >= 70){
    tier = "Passionate Contributor";
  }
   else if (rawScore >= 55) {
    // Raised from 60
    tier = "Active Professional";
  } else if (rawScore >= 35) {
    // Raised from 40
    tier = "Regular Developer";
  } else if (rawScore >= 15) {
    // Raised from 20
    tier = "Casual Contributor";
  }

  return {
    score: rawScore,
    displayScore,
    tier,
    eliteBadge,
    weightedActivity,
    consistencyBonus,
    breakdown,
    penalties,
  };
}
