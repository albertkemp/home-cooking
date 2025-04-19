import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    console.log("API: Starting meal fetch process");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("API: Unauthorized - no session or no email");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("API: User authenticated:", session.user.email);
    
    // Find the cook's menu
    const menu = await prisma.menu.findFirst({
      where: {
        cook: {
          email: session.user.email
        }
      },
    });

    if (!menu) {
      console.log("API: No menu found for cook");
      return NextResponse.json([]);
    }

    console.log("API: Found menu:", menu.id);
    
    // Get all food items for this menu
    const foodItems = await prisma.foodItem.findMany({
      where: {
        menuId: menu.id,
      },
      include: {
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log("API: Found food items:", foodItems.length);
    return NextResponse.json(foodItems);
  } catch (error) {
    console.error("API: Error fetching meals:", error);
    if (error instanceof Error) {
      console.error("API: Error name:", error.name);
      console.error("API: Error message:", error.message);
      console.error("API: Error stack:", error.stack);
    }
    return NextResponse.json(
      { message: "Error fetching meals", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log("API: Starting meal creation process");
    const session = await getServerSession(authOptions);
    console.log("API: Session check", { hasSession: !!session, userId: session?.user?.id });
    
    if (!session?.user) {
      console.log("API: Unauthorized - no session or no user");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    console.log("API: Received form data", {
      hasName: !!formData.get("name"),
      hasDescription: !!formData.get("description"),
      hasPrice: !!formData.get("price"),
      hasAvailable: !!formData.get("available"),
      hasServings: !!formData.get("servings"),
      hasImageUrl: !!formData.get("imageUrl")
    });

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const available = formData.get("available") === "true";
    const servings = parseInt(formData.get("servings") as string) || 1;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const imageUrl = formData.get("imageUrl") as string;

    if (!name || !description || isNaN(price) || price <= 0) {
      console.log("API: Missing required fields", { name, description, price });
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("API: Finding or creating menu for cook", { cookId: session.user.id });
    // Find or create a menu for the cook
    let menu = await prisma.menu.findFirst({
      where: {
        cookId: session.user.id,
      },
    });

    if (!menu) {
      console.log("API: Creating new menu for cook");
      menu = await prisma.menu.create({
        data: {
          cookId: session.user.id,
          name: "My Menu",
          description: "A collection of my homemade meals"
        },
      });
    }
    console.log("API: Menu found/created", { menuId: menu.id });

    console.log("API: Creating food item");
    // Create the food item
    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        description,
        price,
        available,
        servings,
        servingsSold: 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        menuId: menu.id,
        cookId: session.user.id,
      },
    });
    console.log("API: Food item created", { foodItemId: foodItem.id });

    // If an image URL was provided, create an image record
    if (imageUrl) {
      console.log("API: Creating image record", { imageUrl });
      await prisma.image.create({
        data: {
          url: imageUrl,
          foodItemId: foodItem.id,
          userId: session.user.id,
        },
      });
      console.log("API: Image record created");
    }

    console.log("API: Meal creation successful");
    return NextResponse.json(foodItem);
  } catch (error) {
    console.error("API: Error creating meal:", error);
    if (error instanceof Error) {
      console.error("API: Error name:", error.name);
      console.error("API: Error message:", error.message);
      console.error("API: Error stack:", error.stack);
    }
    return NextResponse.json(
      { message: "Failed to create meal", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 