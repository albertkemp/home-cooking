import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/utils/cloudinary";
import { prisma } from "@/lib/prisma";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to upload images" },
        { status: 401 }
      );
    }

    // Check if Cloudinary configuration is available
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const foodItemId = formData.get("foodItemId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "No type provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    let imageUrl;
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `home-cooking/${type}`,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        const stream = Readable.from(buffer);
        stream.pipe(uploadStream);
      });

      imageUrl = (result as any).secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to cloud storage" },
        { status: 500 }
      );
    }

    // Save to database
    try {
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
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Still return the image URL even if database update fails
      return NextResponse.json({ url: imageUrl });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 