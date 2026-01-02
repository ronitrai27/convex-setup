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
    githubAccessToken: v.optional(v.string()),
    last_sign_in: v.optional(v.number()),
    inviteLink: v.optional(v.string()),
    // ✅ PLAN TYPE
    type: v.union(v.literal("free"), v.literal("pro"), v.literal("elite")),

    // ✅ PROJECT LIMIT
    limit: v.union(v.literal(2), v.literal(5), v.literal(15)),

    createdAt: v.number(),
    updatedAt: v.number(),
    //   INDEXES.....
  }).index("by_token", ["tokenIdentifier"]),
});
