import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

// Define types for order items
type OrderItem = {
  foodItemId: string;
  quantity: number;
  price: number;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const { items, total } = await req.json();

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0 || !total || total <= 0) {
      return NextResponse.json({ message: "Invalid order data" }, { status: 400 });
    }

    // Validate each item
    for (const item of items as OrderItem[]) {
      if (!item.foodItemId || !item.quantity || item.quantity <= 0 || !item.price || item.price <= 0) {
        return NextResponse.json({ message: "Invalid item data" }, { status: 400 });
      }
    }

    // Verify all food items exist and are available
    const foodItemIds = (items as OrderItem[]).map((item: OrderItem) => item.foodItemId);
    const foodItems = await prisma.foodItem.findMany({
      where: {
        id: {
          in: foodItemIds
        }
      }
    });

    // Check if all items were found
    if (foodItems.length !== foodItemIds.length) {
      return NextResponse.json({ message: "One or more food items not found" }, { status: 404 });
    }

    // Check if all items are available
    const unavailableItems = foodItems.filter((item: { available: boolean }) => !item.available);
    if (unavailableItems.length > 0) {
      return NextResponse.json({ 
        message: "One or more food items are currently unavailable",
        items: unavailableItems.map((item: { id: string }) => item.id)
      }, { status: 400 });
    }

    console.log(`API Orders: Creating order for eater ${session.user.id} with ${items.length} items`);

    // Create the order and order items in a transaction
    const newOrder = await prisma.order.create({
      data: {
        eaterId: session.user.id,
        status: 'PENDING',
        total: total,
        items: {
          create: (items as OrderItem[]).map(item => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            foodItem: true
          }
        },
      },
    });

    console.log(`API Orders: Order created successfully ${newOrder.id}`);

    return NextResponse.json(newOrder, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("API Orders: Error creating order:", error);
    return NextResponse.json(
      { message: "Error creating order", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 