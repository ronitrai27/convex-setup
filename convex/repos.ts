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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
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
