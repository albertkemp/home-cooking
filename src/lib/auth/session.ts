import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

/**
 * Helper function to get the authenticated session
 * @returns The session if authenticated, or a 401 response if not
 */
export async function getAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      ),
      session: null
    };
  }
  
  return { session, error: null };
} 