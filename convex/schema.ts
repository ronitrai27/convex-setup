import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // USERS TABLE
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(), //clerk user ID for auth
    clerkUserId: v.string(),
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
    // SKILLS
    skills: v.optional(v.array(v.string())),
    lastUpdatedSkillsAt: v.optional(v.number()),

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
    // New additions
    language: v.optional(v.any()), // store only top 2 languages..
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
    agentMode: v.optional(v.union(v.literal("semi-auto"), v.literal("auto"))),
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

  // =========REVIEWS TABLE===========
  reviews: defineTable({
    repoId: v.id("repositories"),
    pushTitle: v.string(),
    pushUrl: v.optional(v.string()),
    authorUserName: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    // prNumber: v.optional(v.number()), // for pr
    commitHash: v.optional(v.string()), // for commit
    reviewType: v.union(v.literal("pr"), v.literal("commit")),
    reviewStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    ctiticalIssueFound: v.optional(v.boolean()),
    review: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_push", ["pushTitle"])
    .index("by_commit", ["commitHash"])
    .index("by_type", ["reviewType"]),

  // ===============Issues Table==============
  issues: defineTable({
    repoId: v.id("repositories"),
    issueTitle: v.string(),
    issueDescription: v.string(),
    issueCreatedByUserId: v.optional(v.id("users")), // in case user creates issue ("by_user")
    issueCreatedByName: v.optional(v.string()),
    issueType: v.optional(
      v.union(
        v.literal("by_user"),
        v.literal("by_agent"),
        v.literal("from_github"),
      ),
    ), // this will help to identify the exact issue and can be use to show in repo visulaizer.
    issueFiles: v.optional(v.string()), // llm will provide the file source
    issueAssignedTo: v.optional(v.id("users")),
    issueStatus: v.optional(
      v.union(
        v.literal("assigned"),
        v.literal("ignored"),
        v.literal("pending"),
        v.literal("resolved"),
      ),
    ),
    issueCreatedAt: v.number(),
    issueUpdatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_status", ["issueStatus"])
    .index("by_assigned_to", ["issueAssignedTo"]),

  // ------------ADDTIONAL PROJECT_DETAILS TABLE FOR AI -------------------
  projectDetails: defineTable({
    projectId: v.id("projects"),
    repoId: v.optional(v.id("repositories")),
    projectTimeline: v.optional(v.string()), // by AI
    projectFeaturesList: v.optional(v.any()), // by AI to know where project goes.
    projectOverview: v.optional(v.string()), // by AI , after understanding user requirements.
    projectStatus: v.optional(
      v.union(v.literal("completed"), v.literal("incomplete")),
    ), // to check if agent has completed the project or not
  })
    .index("by_project", ["projectId"])
    .index("by_repo", ["repoId"]),

  // ------------------CODE SPACE ---------------------------
  codespaces: defineTable({
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    codespaceName: v.optional(v.string()),
    codespaceDescription: v.optional(v.string()),
    code: v.optional(v.string()),
    messageHistory: v.optional(v.array(v.any())),
    // codespaceTeamTags: v.optional(v.array(v.string())), // Future addition.
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_updated_by", ["updatedBy"])
    .index("by_created_by", ["createdBy"]),
});
