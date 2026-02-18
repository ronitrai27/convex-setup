import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * 📘 CONVEX CHEATSHEET: How to write Backend Functions
 *
 * 1️⃣  QUERIES (Fetching Data)
 *    - Used to READ from the database.
 *    - They are "Reactive" (Frontend updates automatically when data changes).
 *    - Syntax Example:
 *      export const getSomething = query({
 *         args: { userId: v.id("users") }, // Validates args (requires: import { v } from "convex/values")
 *         handler: async (ctx, args) => {
 *            return await ctx.db.get(args.userId);
 *         }
 *      });
 *    - Frontend Usage:
 *      const data = useQuery(api.users.getSomething, { userId: "..." });
 *
 * 2️⃣  MUTATIONS (Changing Data)
 *    - Used to CREATE, UPDATE, or DELETE data.
 *    - Runs consistently (Atomic transactions).
 *    - Syntax Example:
 *      export const updateName = mutation({
 *         args: { id: v.id("users"), newName: v.string() },
 *         handler: async (ctx, args) => {
 *            // UPDATE:
 *            await ctx.db.patch(args.id, { name: args.newName });
 *
 *            // CREATE:
 *            // await ctx.db.insert("users", { name: "New guy" });
 *         }
 *      });
 *    - Frontend Usage:
 *      const mutate = useMutation(api.users.updateName);
 *      // In a function or useEffect:
 *      mutate({ id: "...", newName: "New Name" });
 */

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // This guarantees:
    // ❌ Mutation cannot run without Convex auth
    // ✅ Clerk → Convex token bridge is required

    // console.log("identity from clerk ", identity);
    // Find user by tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    // If user already exists
    if (user) {
      const updates: Partial<typeof user> = {};

      if (user.name !== identity.name && identity.name) {
        updates.name = identity.name;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(user._id, updates);
      }

      return user._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      imageUrl: identity.pictureUrl ?? undefined,
      clerkUserId: identity.subject,
      hasCompletedOnboarding: false,

      githubUsername: identity.nickname ?? undefined,
      githubAccessToken: undefined, // will be set later after OAuth
      last_sign_in:
        typeof identity.user_last_sign_in === "number"
          ? identity.user_last_sign_in
          : undefined,
      // DEFAULT PLAN
      type: "free",
      limit: 2,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// =========================================
// GET CURRENT USER
// =========================================
// changes fron query to internalQuery
// Secure
// ✔ Backend-only
// ✔ Reusable by mutations / checks
// Not exposed to the browser
export const getCurrentUser = query({
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

    return user ?? null;
  },
});

// =========================================
// SET GITHUB ACCESS TOKEN
// =========================================
export const setGithubToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Called setGithubToken without authentication present");
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

    await ctx.db.patch(user._id, {
      githubAccessToken: args.token,
    });
  },
});

// COMPLETE ONBOARDING
// =========================================
export const completeOnboarding = mutation({
  args: {}, // No args needed for now, just a status flip
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error(
        "Called completeOnboarding without authentication present",
      );
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

    await ctx.db.patch(user._id, {
      hasCompletedOnboarding: true,
    });
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateUserSkills = mutation({
  args: { skills: v.array(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Called updateUserSkills without authentication present");
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

    await ctx.db.patch(user._id, {
      skills: args.skills,
      lastUpdatedSkillsAt: Date.now(),
    });
  },
});
