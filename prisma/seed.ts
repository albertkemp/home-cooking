import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test user with COOK role
    const testCook = await prisma.user.create({
      data: {
        email: 'testcook@example.com',
        name: 'Test Cook',
        password: 'hashedpassword123', // In production, this should be properly hashed
        role: 'COOK',
        address: '123 Test Street',
        bio: 'I am a test cook',
      },
    });

    console.log('Created test cook:', testCook);

    // Create a menu for the test cook
    const testMenu = await prisma.menu.create({
      data: {
        name: 'Test Menu',
        description: 'A test menu with delicious items',
        cookId: testCook.id,
      },
    });

    console.log('Created test menu:', testMenu);

    // Create a test food item
    const testFoodItem = await prisma.foodItem.create({
      data: {
        name: 'Test Dish',
        description: 'A delicious test dish',
        price: 9.99,
        cookId: testCook.id,
        menuId: testMenu.id,
      },
    });

    console.log('Created test food item:', testFoodItem);

    console.log('Database has been seeded! 🌱');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 