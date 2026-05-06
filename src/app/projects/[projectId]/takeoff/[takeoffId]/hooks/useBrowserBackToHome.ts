"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useBrowserBackToHome() {
  const router = useRouter();

  useEffect(() => {
    const currentUrl = window.location.href;
    window.history.pushState({ __cato_back_intercept__: true }, "", currentUrl);

    const handlePopState = () => {
      router.replace("/home");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);
}
