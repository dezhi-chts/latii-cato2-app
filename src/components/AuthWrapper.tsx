"use client";
import { message, Spin } from "antd";
import { jwtDecode } from "jwt-decode";
import {
  getSession,
  SessionProvider,
  signIn,
  signOut,
  useSession,
} from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function Auth({ children }: { children: React.ReactNode }) {
  const activePage = usePathname();
  const { data: session, status } = useSession();
  const isUser = !!session?.user;

  useEffect(() => {
    if (activePage.includes("/public")) return;
    if (status === "loading") return;
    if (!isUser) signIn("keycloak");
  }, [isUser, status]);

  if (isUser || activePage.includes("/public")) {
    return children;
  }
  return <div>Loading...</div>;
}

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const activePage = usePathname();
  const [loading, setLoading] = useState(true);

  // Function to check user group permissions
  const checkGroupPermission = (
    userGroups: string[] | string | undefined
  ): boolean => {
    if (!userGroups) return false;

    // Handle groups that might be string or array
    const groupsArray = Array.isArray(userGroups) ? userGroups : [userGroups];

    // Exact match - only groups exactly equal to "Latii" will pass
    return groupsArray.some(
      (group) => group && group === process.env.NEXT_PUBLIC_KEYCLOAK_CATO_GROUP
    );
  };

  useEffect(() => {
    if (activePage.includes("/public")) {
      setLoading(false);
      return;
    }

    let timeoutId: string | number | NodeJS.Timeout | undefined;

    const refreshToken_function = async () => {
      try {
        const session = await getSession();
        const token = session?.user?.access_token;

        if (token) {
          const { exp } = jwtDecode(token);
          const now = Date.now() / 1000;

          // Check if token is expired
          if (exp && exp < now) {
            console.warn("Access token expired, signing out...");
            message.error(
              "Session timed out. You will be redirected to the login page to sign in again."
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await signOut({ callbackUrl: "/" });
            return;
          }

          // Check user group permissions
          if (!checkGroupPermission(session.user.groups)) {
            console.warn(
              "User does not have required group permissions (Latii), signing out..."
            );
            message.error("User does not have the permissions.");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await signOut({
              callbackUrl: "/",
              redirect: true,
            });
            return;
          }

          const userData = {
            username: session.user.username,
            email: session.user.email,
            groups: session.user.groups,
            userId: session.user.userId,
            access_token: session.user.access_token,
            refresh_token: session.user.refresh_token,
            name: session?.user.name,
          };

          const existingUserData = localStorage.getItem("userData");
          if (!existingUserData) {
            localStorage.setItem("userData", JSON.stringify(userData));
          }

          setLoading(false);
        } else {
          signIn("keycloak");
        }
      } catch (error) {
        console.error("Error during session check:", error);
        // Sign out on any error
        await signOut({ callbackUrl: "/" });
      } finally {
        timeoutId = setTimeout(refreshToken_function, 2 * 60 * 1000);
      }
    };

    refreshToken_function();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <SessionProvider>
      <Auth>{children}</Auth>
    </SessionProvider>
  );
};

export default AuthWrapper;
