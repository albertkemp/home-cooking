import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import Header from "@/components/Header";
import { SessionProvider } from '@/components/SessionProvider';
import { CartProvider } from '@/contexts/CartContext';
import { Navbar } from '@/components/Navbar';

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Home Cooking",
  description: "Discover delicious homemade meals",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${lato.className} text-base`}>
        <SessionProvider session={session}>
          <CartProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
