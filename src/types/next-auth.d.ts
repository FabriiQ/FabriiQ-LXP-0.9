import "next-auth";
import { UserType } from "@prisma/client";

declare module "next-auth" {
  interface User {
    userType: UserType;
    username: string;
    primaryCampusId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      userType: UserType;
      username: string;
      primaryCampusId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: UserType;
    username: string;
    primaryCampusId?: string | null;
  }
} 