import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in and has an ID
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to submit a review" },
        { status: 401 }
      );
    }
    
    // Get the user ID from the session
    const userId = session.user.id;
    if (!userId) {
      console.error("Session user exists but has no ID:", session);
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Review request body:", body);
    const { cookId, foodItemId, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // For cook reviews
    if (cookId) {
      // Check if the cook exists and is actually a cook
      const cook = await prisma.user.findUnique({
        where: { id: cookId },
      });

      if (!cook) {
        return NextResponse.json(
          { error: "Cook not found" },
          { status: 404 }
        );
      }

      if (cook.role !== "COOK") {
        return NextResponse.json(
          { error: "User is not a cook" },
          { status: 400 }
        );
      }

      // Check if user has already reviewed this cook
      const existingReview = await prisma.review.findFirst({
        where: {
          reviewerId: userId,
          reviewedId: cookId,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this cook" },
          { status: 400 }
        );
      }

      try {
        // Create the cook review
        const review = await prisma.review.create({
          data: {
            rating,
            comment: comment || "",
            reviewer: {
              connect: { id: userId }
            },
            reviewed: {
              connect: { id: cookId }
            }
          },
          include: {
            reviewer: true,
            reviewed: true
          }
        });
        return NextResponse.json(review);
      } catch (error) {
        console.error("Error creating cook review:", error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to create cook review" },
          { status: 500 }
        );
      }
    }

    // For food item reviews
    if (foodItemId) {
      // Check if the food item exists
      const foodItem = await prisma.foodItem.findUnique({
        where: { id: foodItemId },
      });

      if (!foodItem) {
        return NextResponse.json(
          { error: "Food item not found" },
          { status: 404 }
        );
      }

      // Check if user has already reviewed this food item
      const existingReview = await prisma.review.findFirst({
        where: {
          reviewerId: userId,
          foodItemId: foodItemId,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this food item" },
          { status: 400 }
        );
      }

      try {
        // Create the food item review
        const review = await prisma.review.create({
          data: {
            rating,
            comment: comment || "",
            reviewer: {
              connect: { id: userId }
            },
            reviewed: {
              connect: { id: foodItem.cookId }
            },
            foodItem: {
              connect: { id: foodItemId }
            }
          },
        });
        return NextResponse.json(review);
      } catch (error) {
        console.error("Error creating food item review:", error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to create food item review" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Either cookId or foodItemId must be provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing review request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process review request" },
      { status: 500 }
    );
  }
} 