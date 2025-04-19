import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth/auth";
import { prisma } from "../../../lib/db/prisma";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("Starting test endpoint...");
    
    // Ensure we properly await the session
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.email) {
      console.log("No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the cook's menu
    const menu = await prisma.menu.findFirst({
      where: {
        cook: {
          email: session.user.email
        }
      }
    });

    if (!menu) {
      console.log("No menu found for cook");
      return NextResponse.json({ error: "No menu found" }, { status: 404 });
    }

    // Get all food items for the menu
    const foodItems = await prisma.foodItem.findMany({
      where: {
        menuId: menu.id
      },
      include: {
        images: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${foodItems.length} food items`);

    // Test each food item's endpoints
    const results = await Promise.all(foodItems.map(async (item) => {
      try {
        // Test GET endpoint
        const getResult = await prisma.foodItem.findUnique({
          where: { id: item.id },
          include: { images: true }
        });

        return {
          id: item.id,
          name: item.name,
          getResult: getResult ? "Success" : "Failed",
          hasImages: item.images.length > 0
        };
      } catch (error) {
        console.error(`Error testing food item ${item.id}:`, error);
        return {
          id: item.id,
          name: item.name,
          getResult: "Error",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
} 