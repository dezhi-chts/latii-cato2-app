"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export type TakeoffEntrySource = "home" | "project";

const getTakeoffEntrySourceStorageKey = (takeoffId: string) =>
  takeoffId
    ? `takeoff-entry-source-${takeoffId}`
    : "takeoff-entry-source-default";

export function setTakeoffEntrySource(
  takeoffId: string | number,
  source: TakeoffEntrySource,
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    getTakeoffEntrySourceStorageKey(String(takeoffId || "")),
    source,
  );
}

export function getTakeoffEntrySource(
  takeoffId: string | number,
): TakeoffEntrySource | null {
  if (typeof window === "undefined") return null;
  const source = sessionStorage.getItem(
    getTakeoffEntrySourceStorageKey(String(takeoffId || "")),
  );
  if (source === "home" || source === "project") {
    return source;
  }
  return null;
}

export function useBrowserBackToHome() {
  const router = useRouter();
  const params = useParams();
  const projectId = String(params?.projectId || "");
  const takeoffId = String(params?.takeoffId || "");

  useEffect(() => {
    let entrySource = getTakeoffEntrySource(takeoffId) || "home";
    if (!getTakeoffEntrySource(takeoffId)) {
      const referrerPath = (() => {
        try {
          if (!document.referrer) return "";
          return new URL(document.referrer).pathname;
        } catch {
          return "";
        }
      })();
      if (referrerPath === "/home" || referrerPath.startsWith("/home/")) {
        entrySource = "home";
      } else if (
        projectId &&
        (referrerPath === `/projects/${projectId}` ||
          referrerPath.startsWith(`/projects/${projectId}/`))
      ) {
        entrySource = "project";
      }
    }

    const currentUrl = window.location.href;
    window.history.pushState({ __cato_back_intercept__: true }, "", currentUrl);

    const handlePopState = () => {
      if (entrySource === "project" && projectId) {
        router.replace(`/projects/${projectId}`);
        return;
      }
      router.replace("/home");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [projectId, router, takeoffId]);
}
