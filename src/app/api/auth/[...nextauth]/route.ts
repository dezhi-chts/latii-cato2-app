import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import { signOut } from "next-auth/react";

export const GET = async (req, res) => {
  const url = new URL(req.url);
  const baseUrl = process.env.NEXTAUTH_URL;
  if (
    url.pathname.includes("/api/auth/signin") ||
    url.pathname.includes("/api/auth/error")
  ) {
    return NextResponse.redirect(`${baseUrl}`);
  }
  const handler = NextAuth({
    secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET,
    // csrf:false,
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
          const decodedToken = jwtDecode(account.access_token);
          token.clientRoles =
            decodedToken.resource_access?.["qa-service"]?.roles || [];
          token.access_token = account.access_token;
        }
        if (account?.refresh_token) {
          token.refresh_token = account.refresh_token;
        }
        if (profile && profile.groups && profile.groups?.length != 0) {
          token.groups = profile.groups;
        }
        if (profile && profile.preferred_username) {
          token.username = profile.preferred_username;
        }
        if (user && user.id) {
          token.userId = user.id;
        }
        if (account) {
          token.id_token = account.id_token;
          token.provider = account.provider;
        }
        // console.log(new Date());
        const now = Date.now() / 1000;
        const decodedToken = jwtDecode(token?.access_token);
        // console.log("old token:" + token?.access_token)
        // console.log("old refresh_token:" + token?.refresh_token)
        if (decodedToken?.exp && decodedToken?.exp < now) {
          return {};
        }
        if (
          decodedToken?.exp &&
          decodedToken?.exp - 140 * 60 < now &&
          token?.refresh_token
        ) {
          try {
            const url = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`;
            // console.log("url:" + url)
            // console.log("client_id:" + process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID)
            // console.log("client_secret:" + process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET)
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
                refresh_token: token?.refresh_token,
              }),
            });
            if (!response.ok) {
              throw new Error("Failed to refresh token");
            }
            const refreshedTokens = await response.json();
            token.access_token =
              refreshedTokens.access_token || token.access_token;
            token.refresh_token =
              refreshedTokens.refresh_token || token.refresh_token;
            // console.log("new refresh_token:" + token?.refresh_token)
            // console.log("new token:" + token?.access_token)
            // console.log('token refreshed')
          } catch (error) {
            console.error("Token refresh error:", error);
            return {};
          }
        }
        return token;
      },
      async session({ session, token, user }) {
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
      async signOut({ token }) {
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
  });
  return handler(req, res);
};

export const POST = async (req, res) => {
  const handler = NextAuth({
    secret: process.env.NEXT_PUBLIC_KEYCLOAK_SECRET,
    // csrf:false,
    providers: [
      KeycloakProvider({
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "",
        clientSecret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || "",
        issuer: `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`,
      }),
    ],
    callbacks: {
      async jwt({ token, profile, user, account }) {
        const requiredRole = "LatiiDealerUser";
        console.log("Here");
        if (account?.access_token) {
          const decodedToken = jwtDecode(account.access_token);
          token.clientRoles =
            decodedToken.resource_access?.["qa-service"]?.roles || [];
          token.access_token = account.access_token;
          console.log(decodedToken.resource_access?.["qa-service"]?.roles);
        }
        if (account?.refresh_token) {
          token.refresh_token = account.refresh_token;
        }
        if (profile && profile.groups && profile.groups?.length != 0) {
          console.log(profile.groups);
          token.group = profile.groups[0];
        }
        if (profile && profile.preferred_username) {
          token.username = profile.preferred_username;
        }
        if (user && user.id) {
          token.userId = user.id;
        }
        if (account) {
          token.id_token = account.id_token;
          token.provider = account.provider;
        }

        return token;
      },
      async session({ session, token, user }) {
        session.user.group = token.group;
        session.user.username = token.username;
        session.user.userId = token.userId;
        session.user.clientRoles = token.clientRoles;
        session.user.access_token = token.access_token;
        session.user.refresh_token = token.refresh_token;
        return session;
      },
    },
    events: {
      async signOut({ token }) {
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
  });
  return handler(req, res);
};
