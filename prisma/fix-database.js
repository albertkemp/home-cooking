// This script checks and fixes potential database issues
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database check and fix...');
  
  try {
    // Check for users without menus
    const users = await prisma.user.findMany({
      where: {
        role: 'COOK',
      },
      include: {
        menus: true,
      },
    });
    
    console.log(`Found ${users.length} cooks`);
    
    for (const user of users) {
      console.log(`Checking cook: ${user.email}`);
      
      // Create menu if it doesn't exist
      if (user.menus.length === 0) {
        console.log(`Creating menu for cook: ${user.email}`);
        await prisma.menu.create({
          data: {
            name: 'My Menu',
            description: 'My food offerings',
            cookId: user.id,
          },
        });
      }
      
      // Check for food items without menu
      const foodItems = await prisma.foodItem.findMany({
        where: {
          cookId: user.id,
          menuId: null,
        },
      });
      
      if (foodItems.length > 0) {
        console.log(`Found ${foodItems.length} food items without menu for cook: ${user.email}`);
        
        // Get the cook's menu
        const menu = await prisma.menu.findFirst({
          where: {
            cookId: user.id,
          },
        });
        
        if (menu) {
          // Update food items with menu ID
          for (const foodItem of foodItems) {
            console.log(`Updating food item: ${foodItem.name}`);
            await prisma.foodItem.update({
              where: {
                id: foodItem.id,
              },
              data: {
                menuId: menu.id,
              },
            });
          }
        }
      }
      
      // Check for images without food item
      const images = await prisma.image.findMany({
        where: {
          userId: user.id,
          foodItemId: null,
        },
      });
      
      if (images.length > 0) {
        console.log(`Found ${images.length} images without food item for cook: ${user.email}`);
        
        // Delete orphaned images
        for (const image of images) {
          console.log(`Deleting orphaned image: ${image.url}`);
          await prisma.image.delete({
            where: {
              id: image.id,
            },
          });
        }
      }
    }
    
    console.log('Database check and fix completed successfully!');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 