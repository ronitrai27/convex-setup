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
      repoUrl: args.repoUrl,
      ownerId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

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
