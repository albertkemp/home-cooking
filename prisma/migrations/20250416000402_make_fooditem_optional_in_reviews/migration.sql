-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_foodItemId_fkey";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "comment" SET DEFAULT '',
ALTER COLUMN "foodItemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
