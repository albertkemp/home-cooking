# HomeCooking - Connect Local Cooks with Food Enthusiasts

A platform that connects home chefs with people looking for authentic, homemade meals in their neighborhood.

## Features

- Dual user roles: Cooks and Eaters
- Location-based cook recommendations
- Pre-order system for upcoming meals
- Profile management for cooks including menu samples and pricing
- Responsive design for both desktop and mobile use

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- NextAuth.js for authentication
- Vercel for deployment

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Initialize the database:
   ```bash
   npx prisma db push
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

```
DATABASE_URL="postgresql://user:password@localhost:5432/homecooking"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

MIT
