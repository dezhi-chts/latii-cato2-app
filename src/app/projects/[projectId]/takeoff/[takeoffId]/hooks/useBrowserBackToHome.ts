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

    const targetUrl =
      entrySource === "project" && projectId ? `/projects/${projectId}` : "/home";
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const currentState = window.history.state || {};
    const alreadyInstalled =
      currentState?.__cato_back_current__ === true &&
      currentState?.__cato_back_takeoff_id__ === takeoffId &&
      currentState?.__cato_back_target__ === targetUrl;

    if (!alreadyInstalled) {
      window.history.replaceState(
        {
          __cato_back_base__: true,
          __cato_back_takeoff_id__: takeoffId,
          __cato_back_target__: targetUrl,
        },
        "",
        targetUrl,
      );
      window.history.pushState(
        {
          __cato_back_current__: true,
          __cato_back_takeoff_id__: takeoffId,
          __cato_back_target__: targetUrl,
        },
        "",
        currentUrl,
      );
    }

    const handlePopState = () => {
      router.replace(targetUrl);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [projectId, router, takeoffId]);
}
