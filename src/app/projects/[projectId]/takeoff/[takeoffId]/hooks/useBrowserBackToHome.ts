"use client";

import { useEffect, useRef } from "react";
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

interface UseBrowserBackToHomeOptions {
  disableBrowserNavigation?: boolean;
  blockRefreshWithPrompt?: boolean;
}

export function useBrowserBackToHome(
  options?: UseBrowserBackToHomeOptions,
) {
  const router = useRouter();
  const params = useParams();
  const projectId = String(params?.projectId || "");
  const takeoffId = String(params?.takeoffId || "");
  const disableBrowserNavigation = Boolean(options?.disableBrowserNavigation);
  const blockRefreshWithPrompt = options?.blockRefreshWithPrompt ?? true;
  const disableBrowserNavigationRef = useRef(disableBrowserNavigation);
  const blockRefreshWithPromptRef = useRef(blockRefreshWithPrompt);

  useEffect(() => {
    disableBrowserNavigationRef.current = disableBrowserNavigation;
  }, [disableBrowserNavigation]);

  useEffect(() => {
    blockRefreshWithPromptRef.current = blockRefreshWithPrompt;
  }, [blockRefreshWithPrompt]);

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
      if (disableBrowserNavigationRef.current) {
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const state = window.history.state || {};
        window.history.pushState(
          {
            ...state,
            __cato_back_current__: true,
            __cato_back_takeoff_id__: takeoffId,
            __cato_back_target__: targetUrl,
          },
          "",
          currentUrl,
        );
        return;
      }
      router.replace(targetUrl);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!disableBrowserNavigationRef.current) return;
      const key = String(event.key || "").toLowerCase();
      const isRefreshShortcut =
        key === "f5" ||
        ((event.metaKey || event.ctrlKey) && key === "r");
      if (!isRefreshShortcut) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!disableBrowserNavigationRef.current) return;
      if (!blockRefreshWithPromptRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [projectId, router, takeoffId]);
}
