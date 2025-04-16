import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name, role, address, bio } = await req.json();
    
    console.log("Registration attempt:", { email, name, role, address, bio: bio ? "provided" : "not provided" });

    if (!email || !password || !name || !role || !address) {
      console.log("Missing required fields:", {
        email: !email,
        password: !password,
        name: !name,
        role: !role,
        address: !address
      });
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("Creating user with role:", role);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as "USER" | "COOK" | "ADMIN",
        address,
        bio: bio || null,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    console.log("User created successfully:", userWithoutPassword);

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Registration error details:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
} 