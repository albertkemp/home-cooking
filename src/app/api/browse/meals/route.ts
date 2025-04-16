import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    console.log("API Browse: Fetching all food items");

    const foodItems = await prisma.foodItem.findMany({
      where: { 
        // Optionally filter for available: true if you only want available ones initially
        // available: true 
      },
      include: {
        cook: {
          select: { name: true, id: true }, // Select only necessary cook info
        },
        images: {
          select: { url: true },
          take: 1, // Only take the first image for the browse view
        },
      },
      orderBy: [
        { available: 'desc' }, // Available first
        { createdAt: 'desc' }, // Then by newest
      ],
    });

    console.log(`API Browse: Found ${foodItems.length} items`);

    return NextResponse.json(foodItems);
  } catch (error) {
    console.error("API Browse: Error fetching meals:", error);
    return NextResponse.json(
      { message: "Error fetching meals", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 