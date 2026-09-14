"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "kollaam_analytics_session";
const LAST_ACTIVITY_KEY = "kollaam_analytics_last_activity";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getSessionId() {
  const now = Date.now();

  let sessionId = localStorage.getItem(SESSION_KEY);
  const lastActivity = Number(
    localStorage.getItem(LAST_ACTIVITY_KEY) || "0"
  );

  // Start a new session after 30 minutes of inactivity.
  if (
    !sessionId ||
    !lastActivity ||
    now - lastActivity > SESSION_TIMEOUT
  ) {
    sessionId = crypto.randomUUID();

    localStorage.setItem(SESSION_KEY, sessionId);
  }

  localStorage.setItem(
    LAST_ACTIVITY_KEY,
    String(now)
  );

  return sessionId;
}

function getBrowser() {
  const ua = navigator.userAgent;

  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua)) return "Safari";

  return "Other";
}

function getOperatingSystem() {
  const ua = navigator.userAgent;

  if (/Windows/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";

  return "Other";
}

function getDeviceType() {
  const width = window.innerWidth;
  const ua = navigator.userAgent;

  if (
    /Tablet|iPad/i.test(ua) ||
    (width >= 768 && width < 1024)
  ) {
    return "Tablet";
  }

  if (
    /Mobile|Android|iPhone/i.test(ua) ||
    width < 768
  ) {
    return "Mobile";
  }

  return "Desktop";
}

function getConnectionType() {
  const navigatorWithConnection =
    navigator as Navigator & {
      connection?: {
        effectiveType?: string;
      };
    };

  return (
    navigatorWithConnection.connection?.effectiveType ||
    "unknown"
  );
}

function getReferrer() {
  try {
    return document.referrer || null;
  } catch {
    return null;
  }
}

export default function VisitorTracker() {
  const pathname = usePathname();

  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Never record visits to the private admin area.
    if (pathname.startsWith("/admin")) {
      return;
    }

    /*
     * Prevent the same pathname from being inserted twice
     * during the same component lifecycle.
     */
    if (trackedPathRef.current === pathname) {
      return;
    }

    trackedPathRef.current = pathname;

    async function recordVisit() {
      try {
        const sessionId = getSessionId();

        /*
         * Give Next.js/browser time to update the document title.
         */
        await new Promise((resolve) =>
          window.setTimeout(resolve, 50)
        );

        const pageTitle =
          document.title || pathname;

        const referrer = getReferrer();

        const { error } = await supabase
          .from("visitor_pageviews")
          .insert({
            session_id: sessionId,

            path: pathname,

            page_title: pageTitle,

            referrer,

            device_type: getDeviceType(),

            browser: getBrowser(),

            operating_system: getOperatingSystem(),

            screen_width: window.screen.width,

            screen_height: window.screen.height,

            viewport_width: window.innerWidth,

            viewport_height: window.innerHeight,

            language:
              navigator.language || null,

            timezone:
              Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone || null,

            connection_type:
              getConnectionType(),
          });

        if (error) {
          console.error(
            "Kollaam analytics error:",
            error.message
          );

          return;
        }

        console.log(
          `[Kollaam Analytics] ${pathname}`
        );
      } catch (error) {
        console.error(
          "Kollaam visitor tracking failed:",
          error
        );
      }
    }

    recordVisit();
  }, [pathname]);

  return null;
}