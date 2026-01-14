import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Server-side validation for tags
    if (args.tags.length < 2 || args.tags.length > 5) {
      throw new Error("Please select between 2 and 5 tags.");
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
            v.literal("serious")
          ),
        })
      )
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
        })
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
