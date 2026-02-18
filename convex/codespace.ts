import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
// ============================================
// CREATING CODESPACE
// ============================================
export const createCodespace = mutation({
  args: {
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    codespaceName: v.optional(v.string()),
    codespaceDescription: v.optional(v.string()),
    code: v.optional(v.string()),
    messageHistory: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    // CHECK1 : user session
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // CHECK2: user is authorized
    const user = await ctx.db.get(args.createdBy);
    if (!user || user.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    const codespaceId = await ctx.db.insert("codespaces", {
      projectId: args.projectId,
      createdBy: args.createdBy,
      codespaceName: args.codespaceName,
      codespaceDescription: args.codespaceDescription,
      code: args.code,
      messageHistory: args.messageHistory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return codespaceId;
  },
});

// ============================
// GET ALL CODESPACE BY PROJECT ID
// ============================
export const getCodespaces = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const codespaces = await ctx.db
      .query("codespaces")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return codespaces;
  },
});
