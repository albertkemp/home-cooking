import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "COOK" | "EATER";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "COOK" | "EATER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "COOK" | "EATER";
  }
} 