import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // USERS TABLE
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(), //clerk user ID for auth
    email: v.string(),
    imageUrl: v.optional(v.string()),
    hasCompletedOnboarding: v.boolean(),
    githubUsername: v.optional(v.string()),
    githubAccessToken: v.optional(v.string()), // cant store it in db for security reasons.
    last_sign_in: v.optional(v.number()),
    // ✅ PLAN TYPE
    type: v.union(v.literal("free"), v.literal("pro"), v.literal("elite")),

    // ✅ PROJECT LIMIT
    limit: v.union(v.literal(2), v.literal(5), v.literal(15)),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_token", ["tokenIdentifier"]),

  // ===============================
  // REPOSITORIES TABLE
  // ===============================
  repositories: defineTable({
    // relation to project table , every repo is must linked to 1 project.
    githubId: v.int64(),
    name: v.string(),
    owner: v.string(),
    fullName: v.string(),
    url: v.string(),
    // Relation to users table
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"]),
  // ===============================
  // PROJECTS TABLE
  // ===============================
  projects: defineTable({
    // Project details
    projectName: v.string(),
    description: v.string(),
    tags: v.array(v.string()), // Validation (2-5 tags) should be done in mutations
    // Visibility
    isPublic: v.boolean(),
    // Linked repository
    repositoryId: v.id("repositories"),
    repoName: v.string(), // Denormalized for quick access
    repoFullName: v.string(), // e.g., "ronitrai27/Line-Queue-PR-Agent"
    repoOwner: v.string(),
    repoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),

    lookingForMembers: v.optional(
      v.array(
        v.object({
          role: v.string(),
          type: v.union(
            v.literal("casual"),
            v.literal("part-time"),
            v.literal("serious"),
          ),
        }),
      ),
    ),
    // Project owner (creator)
    ownerId: v.id("users"),
    ownerName: v.string(),
    ownerImage: v.string(),
    about: v.optional(v.string()),
    // new details for the project to maintain community engaement
    projectStars: v.number(), // this is for project , on wekraft platform
    projectForks: v.number(), // this fork currently dont include github forks ,only wekraft forks.
    projectUpvotes: v.number(),
    // HEATH SCORES SUPER IMPORTANT ----------------
    healthScore: v.optional(
      v.object({
        totalScore: v.number(), // 0–100
        activityMomentum: v.number(), // 0–35
        maintenanceQuality: v.number(), // 0–35
        communityTrust: v.number(), // 0–20
        freshness: v.number(), // 0–10
        lastCalculatedDate: v.string(), // YYYY-MM-DD
        // Stores last 2 health scores only
        previousScores: v.array(
          v.object({
            totalScore: v.number(), // 0–100
            calculatedDate: v.string(), // YYYY-MM-DD
          }),
        ),
      }),
    ),
    // New additions
    inviteLink: v.optional(v.string()), // new unique
    // TIME STAMPS----
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_repository", ["repositoryId"])
    .index("by_public", ["isPublic"])
    .index("by_invite_link", ["inviteLink"]), // For discovering projects via invite link

  // ============================
  // PROJECT MEMBERS TABLE ( for the particular project)
  // ============================
  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    userName: v.string(), // for quick lookup
    userImage: v.optional(v.string()), // for quick lookup
    AccessRole: v.optional(v.union(v.literal("admin"), v.literal("member"))),
    joinedAt: v.optional(v.number()),
    leftAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_access_role", ["AccessRole"]),

  // ==============================
  // projectJoinRequests
  // ==============================
  projectJoinRequests: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    userName: v.string(), // for quick lookup
    userImage: v.optional(v.string()), // for quick lookup
    message: v.optional(v.string()), // "Hey, I want to contribute"
    source: v.union(v.literal("invited"), v.literal("manual")),

    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(), // whenever status changes
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
