import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    groups?: string[];
    username?: string;
    userId?: string;
    clientRoles?: string[];
    access_token?: string;
    refresh_token?: string;
  }

  interface Session {
    user: User;
  }

  interface Profile {
    groups?: string[];
    preferred_username?: string;
  }
}
