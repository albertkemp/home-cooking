import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/utils/cloudinary";
import { prisma } from "@/lib/db/prisma";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  console.log("Upload API: Starting image upload process");
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    console.log("Upload API: Session check", { hasSession: !!session, userId: session?.user?.id });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to upload images" },
        { status: 401 }
      );
    }

    // Check if Cloudinary configuration is available
    console.log("Upload API: Checking Cloudinary config", {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Upload API: Missing Cloudinary configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const foodItemId = formData.get("foodItemId") as string;

    console.log("Upload API: Received form data", { 
      hasFile: !!file, 
      type, 
      foodItemId 
    });

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
      console.log("Upload API: Starting Cloudinary upload");
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
      console.log("Upload API: Cloudinary upload successful", { imageUrl });
    } catch (uploadError) {
      console.error("Upload API: Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to cloud storage" },
        { status: 500 }
      );
    }

    // Save to database
    try {
      console.log("Upload API: Saving to database");
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

      console.log("Upload API: Database save successful", { imageId: image.id });
      return NextResponse.json(image);
    } catch (dbError) {
      console.error("Upload API: Database error:", dbError);
      // Still return the image URL even if database update fails
      return NextResponse.json({ url: imageUrl });
    }
  } catch (error) {
    console.error("Upload API: Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 