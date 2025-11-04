import KeycloakProvider from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";
import { NextAuthOptions, Session, User } from "next-auth";

interface CustomJwtPayload {
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  exp?: number;
  access_token?: string;
  refresh_token?: string;
  username?: string;
  userId?: string;
  groups?: string[];
  clientRoles?: string[];
}

interface DecodedToken {
  exp?: number;
  access_token?: string;
  refresh_token?: string;
}

const authOptions: NextAuthOptions = {
  secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET,
  providers: [
    KeycloakProvider({
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "",
      clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || "",
      issuer: `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async jwt({ token, profile, user, account }) {
      if (account?.access_token) {
        const decodedToken = jwtDecode<CustomJwtPayload>(account.access_token);
        token.clientRoles =
          decodedToken.resource_access?.["qa-service"]?.roles || [];
        token.access_token = account.access_token;
      }
      if (account?.refresh_token) {
        token.refresh_token = account.refresh_token;
      }
      if (profile?.groups) {
        token.groups = profile.groups;
      }
      if (profile?.preferred_username) {
        token.username = profile.preferred_username;
      }
      if (user?.id) {
        token.userId = user.id;
      }
      if (account) {
        token.id_token = account.id_token;
        token.provider = account.provider;
      }

      const now = Date.now() / 1000;
      const decodedToken = jwtDecode<DecodedToken>(
        token.access_token as string
      );
      if (decodedToken?.exp && decodedToken.exp < now) {
        return {};
      }

      if (
        decodedToken?.exp &&
        decodedToken.exp - 140 * 60 < now &&
        token?.refresh_token
      ) {
        try {
          const url = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`;
          const refreshToken =
            typeof token?.refresh_token === "string" ? token.refresh_token : "";

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "",
              client_secret:
                process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || "",
              grant_type: "refresh_token",
              refresh_token: refreshToken,
            }),
          });

          if (!response.ok) throw new Error("Failed to refresh token");

          const refreshedTokens = await response.json();
          token.access_token =
            refreshedTokens.access_token || token.access_token;
          token.refresh_token =
            refreshedTokens.refresh_token || token.refresh_token;
        } catch (error) {
          console.error("Token refresh error:", error);
          return {};
        }
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session & { user: User };
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      token: any;
    }) {
      session.user.groups = token.groups;
      session.user.username = token.username;
      session.user.userId = token.userId;
      session.user.clientRoles = token.clientRoles;
      session.user.access_token = token.access_token;
      session.user.refresh_token = token.refresh_token;
      return session;
    },
  },
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signOut({ token }: any) {
      if (token.provider === "keycloak") {
        const issuerUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`;
        const logOutUrl = new URL(
          `${issuerUrl}/protocol/openid-connect/logout`
        );
        logOutUrl.searchParams.set("id_token_hint", token.id_token);
        await fetch(logOutUrl);
      }
    },
  },
};

export default authOptions;
