// import { mutation } from "./_generated/server";
// import { v } from "convex/values";
// import { Id } from "./_generated/dataModel";

// const AVAILABLE_TAGS = [
//   "Productivity", "AI", "Healthcare", "Edutech", "Fintech", "Web3", "Agents", "SaaS",
//   "E-commerce", "Social Media", "Developer Tools", "Open Source", "Machine Learning",
//   "Data Science", "Blockchain", "Crypto", "DeFi", "NFT", "Metaverse", "Gaming"
// ];

// const AVAILABLE_ROLES = [
//   "frontend developer", "backend developer", "fullstack developer", "devops engineer",
//   "data engineer", "mobile developer", "UI designer", "AI engineer", "QA engineer"
// ];

// /**
//  * This mutation seeds 6 fake projects into the database for demo purposes.
//  * It will associate them with the specific target user provided.
//  */
// export const seedFakeProjects = mutation({
//   args: {},
//   handler: async (ctx) => {
//     // 1. Use the specific user ID provided by the user
//     const targetUserId = "j57aknn1ry4gzt86kk4cqhr4vs808y8f" as Id<"users">;
    
//     let userRecord = await ctx.db.get(targetUserId);
    
//     // If user doesn't exist with that ID, we'll use fallback data for metadata
//     const ownerName = userRecord?.name || "Demo Architect";
//     const githubUsername = userRecord?.githubUsername || "demo-architect";

//     const projectsAdded = [];

//     // 2. Insert 6 projects
//     for (let i = 1; i <= 6; i++) {
//       const projectName = `demo-${i}`;
      
//       // Create a mock repository record first to satisfy schema relation
//       const repoId = await ctx.db.insert("repositories", {
//         githubId: BigInt(Math.floor(Math.random() * 100000000)),
//         name: `mock-repo-${projectName}`,
//         owner: githubUsername,
//         fullName: `${githubUsername}/mock-repo-${projectName}`,
//         url: `https://github.com/${githubUsername}/mock-repo-${projectName}`,
//         userId: targetUserId,
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//       });

//       const repo = (await ctx.db.get(repoId))!;

//       // Choose 2 to 5 random tags
//       const numTags = Math.floor(Math.random() * 4) + 2;
//       const tags = [...AVAILABLE_TAGS]
//         .sort(() => 0.5 - Math.random())
//         .slice(0, numTags);

//       // Choose 1 to 3 random roles for lookingForMembers
//       const numRoles = Math.floor(Math.random() * 3) + 1;
//       const lookingForMembers = [...AVAILABLE_ROLES]
//         .sort(() => 0.5 - Math.random())
//         .slice(0, numRoles)
//         .map(role => ({
//           role,
//           type: (["casual", "part-time", "serious"][Math.floor(Math.random() * 3)]) as "casual" | "part-time" | "serious"
//         }));

//       // Random health score between 20 and 60
//       const totalScore = Math.floor(Math.random() * 41) + 20;

//       const projectId = await ctx.db.insert("projects", {
//         projectName,
//         description: `This is a generated demo project for ${projectName}. It showcases the community features of WeKraft.`,
//         tags,
//         isPublic: true,
//         repositoryId: repoId,
//         repoName: repo.name,
//         repoFullName: repo.fullName,
//         repoOwner: repo.owner,
//         repoUrl: repo.url,
//         ownerId: targetUserId,
//         ownerName: ownerName,
//         projectStars: Math.floor(Math.random() * 50),
//         projectForks: Math.floor(Math.random() * 20),
//         projectUpvotes: Math.floor(Math.random() * 100),
//         agentMode: "auto",
//         lookingForMembers,
//         healthScore: {
//           totalScore,
//           activityMomentum: Math.floor(totalScore * 0.35),
//           maintenanceQuality: Math.floor(totalScore * 0.35),
//           communityTrust: Math.floor(totalScore * 0.2),
//           freshness: Math.floor(totalScore * 0.1),
//           lastCalculatedDate: new Date().toISOString().split('T')[0],
//           previousScores: []

//         },
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//       });

//       projectsAdded.push(projectName);
//     }
    
//     return {
//       message: "Successfully seeded 6 fake projects with specific owner ID!",
//       projects: projectsAdded,
//       ownedBy: ownerName,
//       ownerId: targetUserId
//     };
//   },
// });
