import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET: Fetch current user data
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            // Select only the fields needed for the settings form
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                address: true,
                bio: true,
            }
        });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        console.error("API Account GET Error:", error);
        return NextResponse.json({ message: "Error fetching account data" }, { status: 500 });
    }
}

// PATCH: Update user data
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { name, address, bio, role, currentPassword, newPassword } = await req.json();
        const updateData: any = {};

        // Validate and add fields to updateData if they exist
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (bio !== undefined) updateData.bio = bio; // Allow empty bio
        if (role && (role === 'COOK' || role === 'EATER')) updateData.role = role;

        // Password Change Logic
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ message: "Current password is required to set a new password" }, { status: 400 });
            }
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ message: "Invalid current password" }, { status: 400 });
            }
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Prevent updating if no data was provided
        if (Object.keys(updateData).length === 0) {
             return NextResponse.json({ message: "No update data provided" }, { status: 400 });
        }

        console.log(`API Account PATCH: User ${userId} updating profile with:`, Object.keys(updateData));

        // Perform the update
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { // Return updated fields (excluding password)
                id: true, email: true, name: true, role: true, address: true, bio: true
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error(`API Account PATCH Error for User ${userId}:`, error);
        return NextResponse.json({ message: "Error updating account" }, { status: 500 });
    }
}

// DELETE: Delete user account
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        console.log(`API Account DELETE: User ${userId} attempting account deletion`);

        // IMPORTANT: Add cascading deletes in Prisma schema or handle related data manually!
        // For now, we assume related data (orders, items, menus) needs careful handling.
        // A simple delete might fail due to foreign key constraints.
        // Consider a soft delete (marking as inactive) or a more complex cleanup.

        // Example: Simple delete (might fail if user has relations)
        // await prisma.user.delete({ where: { id: userId } });

        // Example: More robust approach needed - potentially delete related records first
        // in a transaction, or implement soft delete.
        // For now, just return success for demonstration, but highlight this is incomplete.
        console.warn(`API Account DELETE: Account deletion for ${userId} is mocked. Implement proper cleanup!`);

        // TODO: Implement proper deletion logic here!
        // This could involve deleting related Orders, FoodItems, Menus, Images, Reviews etc.
        // preferably within a Prisma transaction ($transaction). OR implement soft-delete.


        return NextResponse.json({ message: "Account deletion initiated (mocked). Proper cleanup required." }); // Status 200 OK for now

    } catch (error) {
        console.error(`API Account DELETE Error for User ${userId}:`, error);
        // Check if the error is a Prisma known request error
        if (error instanceof PrismaClientKnownRequestError) {
            // Specifically handle foreign key constraint failure
            if (error.code === 'P2003') {
                 return NextResponse.json({ message: "Cannot delete account due to existing related records (e.g., orders)." }, { status: 409 }); // Conflict
            }
        }
        // Generic error for other cases
        return NextResponse.json({ message: "Error deleting account" }, { status: 500 });
    }
} 