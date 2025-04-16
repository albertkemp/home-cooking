import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Even if not strictly an error, return empty array if not logged in
    return NextResponse.json([], { status: 200 }); 
  }

  const eaterId = session.user.id;

  try {
    console.log(`API MyOrders: Fetching non-cancelled orders for eater ${eaterId}`);

    const orders = await prisma.order.findMany({
      where: {
        eaterId: eaterId,
      },
      include: {
        items: {
          include: {
            foodItem: {
              select: { name: true, cookId: true }, // Include food item name and cookId
            },
          },
        },
      },
      orderBy: [
        {
          status: 'asc', // This will sort PENDING first, then COMPLETED, then CANCELLED
        },
        {
          createdAt: 'desc', // Within each status, sort by newest first
        },
      ],
    });

    console.log(`API MyOrders: Found ${orders.length} orders for eater ${eaterId}`);

    return NextResponse.json(orders);

  } catch (error) {
    console.error(`API MyOrders: Error fetching orders for eater ${eaterId}:`, error);
    return NextResponse.json(
      { message: "Error fetching your orders", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 