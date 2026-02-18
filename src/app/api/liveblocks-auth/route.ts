import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Create a session for the current user
  // We identify the user by their Clerk ID
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.fullName || user.username || "Anonymous",
      color: stringToColor(user.id),
      avatar: user.imageUrl,
    },
  });

  // Give the user access to the room
  // Since we are using a general auth endpoint, we can allow access to the requested room
  // The client sends the room ID in the body typically when entering a room, 
  // but simpler 'prepareSession' creates a user session which allows them to be identified.
  // Access rights can be refined here. For now, we authorize their identity.
  // Note: If you want to restrict room access, you'd use session.allow(roomId, session.FULL_ACCESS)
  // But for this "open for team" setup, identity is the primary goal.
  
  // Checking if the request body contains a room to authorized specifically
  const { room } = await request.json().catch(() => ({ room: undefined }));
  if (room) {
      session.allow(room, session.FULL_ACCESS);
  } else {
      // If no specific room is requested (just identifying), we might need to be careful.
      // Liveblocks usually recommends authorizing specific rooms or using wildcard if safe.
      // For this project, let's allow wildcard access for the authenticated user to their projects?
      // Or safer: just allow the room passed in the body.
      // The LiveblocksProvider will call this endpoint.
  }

  const { status, body } = await session.authorize();
  return new NextResponse(body, { status });
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}
