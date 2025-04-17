import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CookProfileClient } from "./CookProfileClient";
import type { User, Menu, FoodItem, Review, Image as PrismaImage } from "@prisma/client";

interface CookProfilePageProps {
  params: {
    id: string;
  };
}

type CookWithRelations = User & {
  menu: (Menu & {
    foodItems: (FoodItem & {
      images: PrismaImage[];
    })[];
  })[];
  reviewsReceived: (Review & {
    reviewer: User;
  })[];
  images: PrismaImage[];
};

export default async function CookProfilePage({ params }: CookProfilePageProps) {
  try {
    const session = await getServerSession(authOptions);
    const cookId = params.id;

    if (!cookId) {
      return notFound();
    }

    const cook = await prisma.user.findUnique({
      where: { id: cookId },
      include: {
        menu: {
          include: {
            foodItems: {
              include: {
                images: true,
              },
            },
          },
        },
        reviewsReceived: {
          include: {
            reviewer: true,
          },
        },
        images: true,
      },
    }) as CookWithRelations | null;

    if (!cook || cook.role !== "COOK") {
      return notFound();
    }

    return <CookProfileClient cook={cook} session={session} />;
  } catch (error) {
    console.error("Error in CookProfilePage:", error);
    return notFound();
  }
} 