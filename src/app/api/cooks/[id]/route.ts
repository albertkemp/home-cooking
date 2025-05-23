import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cook = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        menu: {
          include: {
            foodItems: {
              include: {
                images: true,
              },
            },
          },
        },
        images: true,
        reviewsReceived: {
          include: {
            reviewer: true,
          },
          where: {
            foodItemId: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cook || cook.role !== "COOK") {
      return NextResponse.json(
        { error: "Cook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(cook);
  } catch (error) {
    console.error('Error fetching cook:', error);
    return NextResponse.json(
      { error: "Failed to fetch cook data" },
      { status: 500 }
    );
  }
} 