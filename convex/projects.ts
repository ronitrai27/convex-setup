import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    projectName: v.string(),
    description: v.string(),
    tags: v.array(v.string()), // Validation (2-5 tags) will be checked here
    isPublic: v.boolean(),
    repositoryId: v.id("repositories"),
    // Denormalized repository data
    repoName: v.string(),
    repoFullName: v.string(),
    repoOwner: v.string(),
    repoUrl: v.string(),
    ownerName: v.string(),
    ownerImage: v.string(),
    inviteLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Server-side validation for tags
    if (args.tags.length < 2 || args.tags.length > 5) {
      throw new Error("Please select between 2 and 5 tags.");
    }

    // Ensure invite link is unique if provided
    if (args.inviteLink) {
      const existingProject = await ctx.db
        .query("projects")
        .withIndex("by_invite_link", (q) => q.eq("inviteLink", args.inviteLink))
        .first();

      if (existingProject) {
        throw new Error("Invite link already exists. Please try again.");
      }
    }

    // Check if project with same name already exists for this user (optional but good practice)
    // For now, we'll allow it or rely on unique constraints if any.
    // Schema doesn't enforce unique project name per user, but it's good UX.
    // omitted for MVP speed unless requested.

    const projectId = await ctx.db.insert("projects", {
      projectName: args.projectName,
      description: args.description,
      tags: args.tags,
      isPublic: args.isPublic,
      repositoryId: args.repositoryId,
      repoName: args.repoName,
      repoFullName: args.repoFullName,
      repoOwner: args.repoOwner,
      projectStars: 0,
      projectForks: 0,
      projectUpvotes: 0,
      repoUrl: args.repoUrl,
      ownerId: user._id,
      inviteLink: args.inviteLink,
      ownerName: user.name,
      // @ts-ignore
      ownerImage: user.imageUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// =================================
// GET PROJECTS
// =================================
export const getProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc") // Show newest first
      .collect();

    return projects;
  },
});

// =================================
// GET PROJECT BY ID
// =================================
export const getProjectById = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   return null;
    // }

    const project = await ctx.db.get(args.projectId);

    // Optional: You might want to check if the user is the owner
    // const user = ... get user ...
    // if (project.ownerId !== user._id) throw new Error("Unauthorized");

    return project;
  },
});

export const updateThumbnail = mutation({
  args: {
    projectId: v.id("projects"),
    thumbnailUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.projectId, {
      thumbnailUrl: args.thumbnailUrl,
      updatedAt: Date.now(),
    });
  },
});

// ===================================
// UPDATE PROJECT
// ===================================
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
    about: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.description !== undefined) updates.description = args.description;
    if (args.about !== undefined) updates.about = args.about;
    if (args.tags !== undefined) {
      if (args.tags.length < 2 || args.tags.length > 5) {
        throw new Error("Please select between 2 and 5 tags.");
      }
      updates.tags = args.tags;
    }
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.lookingForMembers !== undefined)
      updates.lookingForMembers = args.lookingForMembers;

    await ctx.db.patch(args.projectId, updates);
  },
});

// =================================
// UPDATE ABOUT SECTION TAB
// =================================
export const updateAbout = mutation({
  args: {
    projectId: v.id("projects"),
    about: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.projectId, {
      about: args.about,
      updatedAt: Date.now(),
    });
  },
});

// =================================
// UPDATE HEALTH SCORE
// =================================
export const updateHealthScore = mutation({
  args: {
    projectId: v.id("projects"),
    healthScore: v.object({
      totalScore: v.number(),
      activityMomentum: v.number(),
      maintenanceQuality: v.number(),
      communityTrust: v.number(),
      freshness: v.number(),
      lastCalculatedDate: v.string(),
      previousScores: v.array(
        v.object({
          totalScore: v.number(),
          calculatedDate: v.string(),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only owner can update health score (or maybe system? For now restrict to owner like others)
    if (project.ownerId !== identity.tokenIdentifier && !project.ownerId) {
      // Note: ownerId is a user ID (database ID), identity.tokenIdentifier is just the token sub.
      // We should check user existence like other mutations.
    }

    // We'll follow the pattern of other mutations to verify user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");
    if (project.ownerId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.projectId, {
      healthScore: args.healthScore,
      updatedAt: Date.now(),
    });
  },
});

// =======================================
// GET PROJECT BY INVITE LINK
// =======================================
export const getProjectByInviteLink = query({
  args: {
    inviteLink: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_invite_link", (q) => q.eq("inviteLink", args.inviteLink))
      .unique();

    return project;
  },
});

// =======================================
// REQUEST JOIN PROJECT
// =======================================
export const requestJoinProject = mutation({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    source: v.union(v.literal("invited"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId === user._id) {
      throw new Error("You are the owner of this project");
    }

    // Check if request already exists
    const existingRequest = await ctx.db
      .query("projectJoinRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        throw new Error("Request already pending");
      }
      if (existingRequest.status === "accepted") {
        throw new Error("You are already a member");
      }
    }

    // Check if already a member
    const isMember = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (isMember) {
      throw new Error("You are already a member of this project");
    }

    await ctx.db.insert("projectJoinRequests", {
      projectId: args.projectId,
      userId: user._id,
      userName: user.name,
      userImage: user.imageUrl,
      message: args.message,
      source: args.source,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// =======================================
// GET MY PROJECT ROLE
// =======================================
export const getMyProjectRole = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      return { isOwner: false, isAdmin: false, isMember: false, role: null };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user)
      return { isOwner: false, isAdmin: false, isMember: false, role: null };

    const project = await ctx.db.get(args.projectId);
    if (!project)
      return { isOwner: false, isAdmin: false, isMember: false, role: null };

    const isOwner = project.ownerId === user._id;
    console.log("isOwner", isOwner);

    // Check member record
    const memberRecord = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    const isMember = !isOwner || memberRecord?.AccessRole === "member"; // who is part of team has member role
    const isAdmin = memberRecord?.AccessRole === "admin"; // who is part of team as Admin
    const isPower = isOwner || isAdmin; // who has power either admin or owner

    console.log("isAdmin", isAdmin);
    console.log("isMember", isMember);
    console.log("isPower", isPower);
    return {
      isOwner,
      isAdmin,
      isMember,
      isPower,
      role: isOwner
        ? "owner"
        : memberRecord?.AccessRole || (isMember ? "member" : null),
    };
  },
});

// =======================================
// GET PROJECT REQUESTS
// =======================================
export const getProjectRequests = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    // Check if user is at least a member (or owner) to see requests
    // Owner check:
    const isOwner = project.ownerId === user._id;

    // Member check:
    let isMember = isOwner;
    if (!isMember) {
      const member = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .first();
      isMember = !!member;
    }

    if (!isMember) {
      // Not authorized to view requests
      return [];
    }

    const requests = await ctx.db
      .query("projectJoinRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return requests;
  },
});

// =======================================
// RESOLVE JOIN REQUEST
// =======================================
export const resolveJoinRequest = mutation({
  args: {
    requestId: v.id("projectJoinRequests"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const project = await ctx.db.get(request.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check Authorization: Owner OR Admin
    const isOwner = project.ownerId === user._id;
    let isAdmin = isOwner;

    if (!isOwner) {
      const memberRecord = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .first();

      if (memberRecord?.AccessRole === "admin") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      throw new Error("Unauthorized: Only Admins can resolve requests");
    }

    await ctx.db.patch(args.requestId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    if (args.status === "accepted") {
      // Check if already a member to be safe
      const isMember = await ctx.db
        .query("projectMembers")
        .withIndex("by_project", (q) => q.eq("projectId", request.projectId))
        .filter((q) => q.eq(q.field("userId"), request.userId))
        .first();

      if (!isMember) {
        await ctx.db.insert("projectMembers", {
          projectId: request.projectId,
          userId: request.userId,
          userName: request.userName,
          userImage: request.userImage,
          AccessRole: "member",
          joinedAt: Date.now(),
        });
      }
    }
  },
});
// =======================================
// SEARCH AND RANK PROJECTS
// =======================================
export const searchAndRank = query({
  args: {
    tags: v.optional(v.array(v.string())),
    roles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Fetch all public projects
    const allPublicProjects = await ctx.db
      .query("projects")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // If no tags or roles provided, just return all public projects ranked
    if (!args.tags && !args.roles) {
      return allPublicProjects.sort((a, b) => {
        const scoreA = a.healthScore?.totalScore ?? 0;
        const scoreB = b.healthScore?.totalScore ?? 0;
        return scoreB - scoreA;
      });
    }

    const filtered = allPublicProjects.filter((project) => {
      const hasTags = args.tags && args.tags.length > 0;
      const hasRoles = args.roles && args.roles.length > 0;

      // Check tags match
      let tagMatch = true;
      if (hasTags) {
        tagMatch = project.tags.some((tag) => args.tags!.includes(tag));
      }

      // Check roles match
      let roleMatch = true;
      if (hasRoles) {
        roleMatch = project.lookingForMembers
          ? project.lookingForMembers.some((m) => args.roles!.includes(m.role))
          : false;
      }

      // Intersection (AND) logic: Must satisfy both if both are provided
      return tagMatch && roleMatch;
    });

    // Rank by healthScore totalScore
    return filtered.sort((a, b) => {
      const scoreA = a.healthScore?.totalScore ?? 0;
      const scoreB = b.healthScore?.totalScore ?? 0;
      return scoreB - scoreA;
    });
  },
});

// =======================================
// GET PROJECT MEMBERS
// =======================================
export const getProjectMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return members;
  },
});

// ===============================================
export const createReview = mutation({
  args: {
    repoId: v.id("repositories"),
    pushTitle: v.string(),
    pushUrl: v.optional(v.string()),
    commitHash: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    authorUserName: v.string(),
    reviewType: v.union(v.literal("pr"), v.literal("commit")),
    reviewStatus: v.union(v.literal("pending"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reviews", {
      repoId: args.repoId,
      pushTitle: args.pushTitle,
      pushUrl: args.pushUrl,
      commitHash: args.commitHash,
      authorAvatar: args.authorAvatar,
      authorUserName: args.authorUserName,
      reviewType: args.reviewType,
      reviewStatus: args.reviewStatus, // pending
      review: "", // Initial empty review
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ===============================================
export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    review: v.string(),
    reviewStatus: v.union(v.literal("completed"), v.literal("failed")),
    ctiticalIssueFound: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reviewId, {
      review: args.review,
      reviewStatus: args.reviewStatus,
      ctiticalIssueFound: args.ctiticalIssueFound,
      updatedAt: Date.now(),
    });
  },
});

// ===============================================
export const createIssue = mutation({
  args: {
    repoId: v.id("repositories"),
    issueTitle: v.string(),
    issueDescription: v.string(),
    issueCreatedByUserId: v.optional(v.id("users")),
    issueCreatedByName: v.optional(v.string()),
    issueType: v.optional(v.union(v.literal("by_user"), v.literal("by_agent"), v.literal("from_github"))),
    issueFiles: v.optional(v.string()),
    issueAssignedTo: v.optional(v.id("users")),
    issueStatus: v.union(
      v.literal("assigned"),
      v.literal("ignored"),
      v.literal("pending"),
      v.literal("resolved"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("issues", {
      repoId: args.repoId,
      issueTitle: args.issueTitle,
      issueDescription: args.issueDescription,
      issueCreatedByUserId: args.issueCreatedByUserId,
      issueCreatedByName: args.issueCreatedByName,
      issueType: args.issueType,
      issueFiles: args.issueFiles,
      issueAssignedTo: args.issueAssignedTo,
      issueStatus: args.issueStatus,
      issueCreatedAt: Date.now(),
      issueUpdatedAt: Date.now(),
    });
  },
});

// -------------------------
// PojectDetails
// --------------------------
export const getProject_Details = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db
    .query("projectDetails")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .first();
    return project;
  },
})

// -----------------------------
// UPDATE PROJECT DETAILS
// -----------------------------
export const updateProjectDetails = mutation({
  args: {
    projectId: v.id("projects"),
    repoId: v.optional(v.id("repositories")),
    projectTimeline: v.optional(v.string()),
    projectFeaturesList: v.optional(v.any()), // Array of features
    projectOverview: v.optional(v.string()),
    projectStatus: v.optional(
      v.union(v.literal("completed"), v.literal("incomplete")),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projectDetails")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    const data = {
      projectId: args.projectId,
      repoId: args.repoId,
      projectTimeline: args.projectTimeline,
      projectFeaturesList: args.projectFeaturesList,
      projectOverview: args.projectOverview,
      projectStatus: args.projectStatus || "completed",
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("projectDetails", data);
    }
  },
});

// -----------------------------
// GET TEAM SKILLS
// -----------------------------
export const getProjectTeamSkills = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Include owner and all members
    const userIds = new Set<string>();
    userIds.add(project.ownerId);
    members.forEach((m) => userIds.add(m.userId));

    const teamSkills = [];
    for (const userId of Array.from(userIds)) {
      const user = await ctx.db.get(userId as Id<"users">);
      if (user) {
        teamSkills.push({
          userName: user.name,
          skills: user.skills || [],
        });
      }
    }
    return teamSkills;
  },
});

// =======================================
// PROJECT_DETAILS TOOL
export const getProject_detailTool = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const projectDetails = await ctx.db
      .query("projectDetails")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    return {
      projectOverview: projectDetails?.projectOverview,
      projectTimeline: projectDetails?.projectTimeline,
      projectFeaturesList: projectDetails?.projectFeaturesList,
    };
  }
})
