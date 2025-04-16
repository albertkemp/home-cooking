import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth/auth";
import { prisma } from "../../../../lib/db/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("API: User authenticated, fetching meal details");
    const meal = await prisma.foodItem.findUnique({
      where: { id: resolvedParams.id },
      include: {
        images: true,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    console.log("API: Found meal:", meal);
    return NextResponse.json(meal);
  } catch (error) {
    console.error("API: Error fetching meal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mealId = params.id;
    console.log("API: Starting meal update process for ID:", mealId);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("API: Unauthorized - no session or no user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("API: User authenticated:", session.user.id);

    // Get the cook's menu
    const menu = await prisma.menu.findFirst({
      where: {
        cookId: session.user.id
      }
    });

    if (!menu) {
      console.log("API: No menu found for cook:", session.user.id);
      return NextResponse.json({ error: "No menu found" }, { status: 404 });
    }

    console.log("API: Found menu:", menu.id);

    // Verify the meal belongs to the cook's menu
    const existingMeal = await prisma.foodItem.findFirst({
      where: {
        id: mealId,
        menuId: menu.id
      }
    });

    if (!existingMeal) {
      console.log("API: Meal not found or unauthorized:", mealId);
      return NextResponse.json({ error: "Meal not found or unauthorized" }, { status: 404 });
    }

    console.log("API: Found existing meal:", existingMeal.id);

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : undefined;
    const available = formData.get("available") === "true";
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const image = formData.get("image") as File;

    console.log("API: Received form data:", {
      name,
      description,
      price,
      available,
      startDate,
      endDate,
      hasImage: !!image
    });

    // Create update data object with only the fields that are provided
    const updateData: any = {};
    
    if (name !== null) updateData.name = name;
    if (description !== null) updateData.description = description;
    if (price !== undefined && !isNaN(price) && price > 0) updateData.price = price;
    if (formData.has("available")) updateData.available = available;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    console.log("API: Updating meal with data:", updateData);

    const meal = await prisma.foodItem.update({
      where: { id: mealId },
      data: updateData,
    });

    console.log("API: Meal updated successfully:", meal.id);
    return NextResponse.json(meal);
  } catch (error) {
    console.error("API: Error updating meal:", error);
    if (error instanceof Error) {
      console.error("API: Error name:", error.name);
      console.error("API: Error message:", error.message);
      console.error("API: Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to update meal", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const url = new URL(req.url);
    const isImageDelete = url.searchParams.get('type') === 'image';
    
    console.log("Server: DELETE request received for meal ID:", resolvedParams.id, "type:", isImageDelete ? "image" : "meal");
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Server: No authenticated user found");
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
      console.log("Server: No menu found for cook");
      return NextResponse.json({ error: "No menu found" }, { status: 404 });
    }

    // Verify the meal belongs to the cook's menu
    const meal = await prisma.foodItem.findFirst({
      where: {
        id: resolvedParams.id,
        menuId: menu.id
      }
    });

    if (!meal) {
      console.log("Server: Meal not found or doesn't belong to cook's menu");
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    if (isImageDelete) {
      // Only delete the images
      console.log("Server: Deleting associated images");
      await prisma.image.deleteMany({
        where: { foodItemId: resolvedParams.id }
      });
      console.log("Server: Images deleted successfully");
      return NextResponse.json({ message: "Images deleted successfully" });
    }

    // For full meal deletion, check for order items
    const mealWithOrders = await prisma.foodItem.findFirst({
      where: {
        id: resolvedParams.id,
        menuId: menu.id
      },
      include: {
        orders: {
          include: {
            order: true
          }
        }
      }
    });

    if (mealWithOrders?.orders && mealWithOrders.orders.length > 0) {
      console.log("Server: Meal has order items, cannot delete");
      return NextResponse.json(
        { error: "Cannot delete meal with order history" },
        { status: 400 }
      );
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx: typeof prisma) => {
      // Delete associated images first
      console.log("Server: Deleting associated images");
      await tx.image.deleteMany({
        where: { foodItemId: resolvedParams.id }
      });

      // Delete the meal
      console.log("Server: Deleting meal");
      await tx.foodItem.delete({
        where: { id: resolvedParams.id }
      });
    });

    console.log("Server: Meal deleted successfully");
    return NextResponse.json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Server: Error deleting meal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
} 