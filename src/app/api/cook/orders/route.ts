import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'COOK') {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const cookId = session.user.id;

  try {
    console.log(`API Cook Orders: Fetching PENDING orders for cook ${cookId}`);

    // Find orders that contain items belonging to this cook AND are PENDING
    const orders = await prisma.order.findMany({
      where: {
        // Filter by cook's items
        items: {
          some: {
            foodItem: {
              cookId: cookId,
            },
          },
        },
        // Only include PENDING orders
        status: 'PENDING',
      },
      include: {
        items: {
          // Include only items belonging to this cook if necessary
          // where: { foodItem: { cookId: cookId } }, 
          include: {
            foodItem: {
              select: { name: true }, // Include food item name
            },
          },
        },
        eater: {
          select: { name: true, email: true }, // Include basic eater info
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest orders first
      },
    });

    console.log(`API Cook Orders: Found ${orders.length} orders for cook ${cookId}`);

    return NextResponse.json(orders);

  } catch (error) {
    console.error(`API Cook Orders: Error fetching orders for cook ${cookId}:`, error);
    return NextResponse.json(
      { message: "Error fetching orders", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 