import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/utils/cloudinary";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to upload images" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "profile" or "food"
    const foodItemId = formData.get("foodItemId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: type === "profile" ? "profiles" : "food-items",
            public_id: foodItemId ? `food-${foodItemId}` : undefined,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const imageUrl = (result as any).secure_url;

    // Save to database
    const image = await prisma.image.create({
      data: {
        url: imageUrl,
        userId: session.user.id,
        foodItemId: foodItemId || null,
      },
    });

    // If this is a profile image, update the user's image field
    if (type === "profile") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: imageUrl },
      });
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
} 