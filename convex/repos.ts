import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRepository = mutation({
  args: {
    githubId: v.int64(),
    name: v.string(),
    owner: v.string(),
    fullName: v.string(),
    url: v.string(),
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

    // Check if user already has a connected repository
    const existingRepo = await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingRepo) {
      throw new Error("You can only connect one repository.");
    }

    const repositoryId = await ctx.db.insert("repositories", {
      githubId: args.githubId,
      name: args.name,
      owner: args.owner,
      fullName: args.fullName,
      url: args.url,
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { repositoryId, userId: user.tokenIdentifier };
  },
});

export const getRepository = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const getRepoByGithubId = query({
  args: { githubId: v.int64() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();
  },
});

export const getReviewsByRepoId = query({
  args: { repoId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();
  },
});

export const getIssuesByRepoId = query({
  args: { repoId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();
  },
});
export const getRepoByName = query({
  args: { owner: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .filter((q) =>
        q.and(
          q.eq(q.field("owner"), args.owner),
          q.eq(q.field("name"), args.name),
        ),
      )
      .first();
  },
});
export const getRepoById = query({
  args: { repoId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repoId);
  },
});

// ===================================
// TOOLS----------------------------
// TOOL USED BY AGENT TO GET RECENT ISSUE OR NUMBER OF ISSUE
export const getIssueTool = query({
  args: {
    repoId: v.id("repositories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const takeCount = args.limit && args.limit > 0 ? args.limit : 1;

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .take(takeCount);

    if (!issues || issues.length === 0) {
      return {
        success: false,
        message: "No issues found",
        data: [],
      };
    }

    return {
      success: true,
      data: issues,
    };
  },
});