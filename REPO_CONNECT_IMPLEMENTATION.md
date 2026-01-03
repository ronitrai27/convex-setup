# Repository Connection & Indexing Implementation

This document details the implementation of the "Connect Repository" feature, which stores repository details in Convex and triggers a background indexing job via Inngest.

## 1. Overview
The flow is as follows:
1. **User Connection**: User clicks "Connect" on a repository in the UI.
2. **Persistence**: The repository details are stored in the Convex database (`repositories` table). We enforce a "one repository per user" rule.
3. **Background Trigger**: Immediately after storage, a Server Action triggers an Inngest event (`repository-connected`).
4. **Indexing**: The Inngest function picks up the event, fetches the user's GitHub token (backend-to-backend), retrieves file contents, and indexes them into Pinecone.

## 2. Implementation Details

### A. Frontend (`src/modules/authFlow/use-repo.tsx`)
- **Integration**: Added `useMutation` for `createRepository` and `useQuery` for `getRepository`.
- **Logic**:
  - Checks if a repository is already connected using `storedRepo`.
  - Determines if the "Connect" button should be disabled (if another repo is connected) or show "Connected".
  - `handleConnect`: 
    1. Calls `createRepo` mutation.
    2. Calls `triggerRepoIndexing` server action.
    3. Handles loading and error states using `sonner` toasts.
- **Fixes**: Handled `BigInt` vs `number` type mismatch for GitHub IDs.

### B. Convex Backend (`convex/repos.ts`)
- **`createRepository` Mutation**:
  - Authenticates the user.
  - Checks if the user already has a repository in the `repositories` table.
  - Throws an error if a repo already exists.
  - Inserts the new repository.
- **`getRepository` Query**:
  - Returns the currently connected repository for the user (to drive UI state).

### C. GitHub Actions & Token Handling (`src/modules/github/action.ts`)
- **Problem**: The original `getGithubAccessToken` relied on `auth()` (request time), which is not available in background jobs.
- **Solution**:
  - Added `getUserGithubToken(userId)`: Fetches the OAuth token using `clerkClient` and `userId` directly.
  - Updated `getRepoFileContents`: Accepts an optional `accessToken` argument. If provided, it uses it instead of trying to fetch from the request context.

### D. Inngest Function (`src/inngest/functions/index.ts`)
- **Updates**:
  - Now receives `userId` in the `event.data`.
  - Uses `getUserGithubToken(userId)` to get a valid token in the background context.
  - Calls `getRepoFileContents` passing this valid token.

### E. Server Action (`src/app/actions/inngest.ts`)
- Created `triggerRepoIndexing`:
  - A secure Server Action that retrieves the current `userId` (via `auth()`) and sends the `repository-connected` event to Inngest with `{ owner, repo, userId }`.

## 3. How to Verify
1.  **Frontend**: Go to the repository selection screen.
2.  **Action**: Click "Connect" on a repository.
3.  **UI Feedback**: You should see a success toast and the button change to "Connected" (green). Other buttons should become disabled.
4.  **Database**: Check Convex Dashboard -> `repositories` table. a new entry should exist.
5.  **Inngest**: Run `npx inngest-cli dev` (if not running) and check the dashboard. You should see the `index-repo` function trigger.
6.  **Logs**: The Inngest function logs "Token fetched in Inngest Function.." and indexing progress.
