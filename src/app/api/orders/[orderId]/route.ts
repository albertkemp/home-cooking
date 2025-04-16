import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

// Route: /api/orders/[orderId]
export async function DELETE(
    req: Request, 
    { params }: { params: { orderId: string } } // Read orderId from route params
) {
    const session = await getServerSession(authOptions);
    const orderId = params.orderId;

    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!orderId) {
        return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    try {
        console.log(`API Orders DELETE: User ${userId} attempting to cancel order ${orderId}`);

        // Find the order and verify ownership and status
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // IMPORTANT: Check if the logged-in user is the one who placed the order
        if (order.eaterId !== userId) {
            console.warn(`API Orders DELETE: User ${userId} attempted to cancel order ${orderId} owned by ${order.eaterId}`);
            return NextResponse.json({ message: "Forbidden: You can only cancel your own orders." }, { status: 403 });
        }

        // Check if the order is already cancelled or completed (or other non-cancellable status)
        if (order.status !== 'PENDING') {
            return NextResponse.json(
                { message: `Cannot cancel order with status: ${order.status}` }, 
                { status: 400 } // Bad request
            );
        }

        // Update the order status to CANCELLED
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
        });

        console.log(`API Orders DELETE: Order ${orderId} cancelled successfully by user ${userId}`);
        return NextResponse.json({ message: "Order cancelled successfully", order: updatedOrder });

    } catch (error) {
        console.error(`API Orders DELETE: Error cancelling order ${orderId} for user ${userId}:`, error);
        return NextResponse.json(
            { message: "Error cancelling order", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// PATCH Handler to update order status (e.g., mark as completed)
export async function PATCH(
    req: Request, 
    { params }: { params: { orderId: string } }
) {
    const session = await getServerSession(authOptions);
    const orderId = params.orderId;
    const { status: newStatus } = await req.json(); // Expecting { "status": "COMPLETED" } in body

    // 1. Authentication & Authorization
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Ensure user is a cook to perform this action
    if (session.user.role !== 'COOK') {
        return NextResponse.json({ message: "Forbidden: Only cooks can update order status." }, { status: 403 });
    }
    const cookId = session.user.id;

    // 2. Input Validation
    if (!orderId) {
        return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
    }
    // Validate the new status is one we allow cooks to set (e.g., COMPLETED)
    if (newStatus !== 'COMPLETED') { // Extend later if needed (CONFIRMED, PREPARING etc.)
        return NextResponse.json({ message: `Invalid target status: ${newStatus}` }, { status: 400 });
    }

    try {
        console.log(`API Orders PATCH: Cook ${cookId} updating order ${orderId} to ${newStatus}`);

        // 3. Verify Order Existence and Cook Ownership
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                // Ensure at least one item in the order belongs to this cook
                items: {
                    some: {
                        foodItem: {
                            cookId: cookId,
                        },
                    },
                },
            },
        });

        if (!order) {
            console.warn(`API Orders PATCH: Order ${orderId} not found or doesn't belong to cook ${cookId}`);
            return NextResponse.json({ message: "Order not found or you do not have permission to modify it." }, { status: 404 });
        }

        // 4. Check if transition is valid (e.g., only from PENDING to COMPLETED)
        if (order.status !== 'PENDING') { 
            return NextResponse.json(
                { message: `Cannot mark order as completed from current status: ${order.status}` }, 
                { status: 400 }
            );
        }

        // 5. Update the Order Status
        const updatedOrder = await prisma.order.update({
            where: { 
                id: orderId,
            },
            data: { 
                status: newStatus,
            },
        });

        console.log(`API Orders PATCH: Order ${orderId} updated to ${newStatus} by cook ${cookId}`);
        return NextResponse.json(updatedOrder);

    } catch (error) {
        console.error(`API Orders PATCH: Error updating order ${orderId} for cook ${cookId}:`, error);
        return NextResponse.json(
            { message: "Error updating order", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// NOTE: You might want GET and PATCH handlers here too for viewing/updating single orders later. 