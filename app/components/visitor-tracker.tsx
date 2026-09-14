"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getBrowser() {
  const userAgent = navigator.userAgent;

  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Safari\//i.test(userAgent)) return "Safari";

  return "Other";
}

function getOperatingSystem() {
  const userAgent = navigator.userAgent;

  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";

  return "Other";
}

function getDeviceType() {
  const width = window.innerWidth;
  const userAgent = navigator.userAgent;

  if (/Tablet|iPad/i.test(userAgent) || (width >= 768 && width < 1024)) {
    return "Tablet";
  }

  if (/Mobile|Android|iPhone/i.test(userAgent) || width < 768) {
    return "Mobile";
  }

  return "Desktop";
}

function getConnectionType() {
  const connection = (
    navigator as Navigator & {
      connection?: {
        effectiveType?: string;
      };
    }
  ).connection;

  return connection?.effectiveType || "unknown";
}

function getSessionId() {
  const storageKey = "kollaam_visitor_session";

  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

export default function VisitorTracker() {
  const pathname = usePathname();

  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Never track the private admin area.
    if (pathname.startsWith("/admin")) {
      return;
    }

    // Prevent duplicate tracking caused by React development mode.
    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    async function trackPageView() {
      try {
        const sessionId = getSessionId();

        const { error } = await supabase
          .from("visitor_pageviews")
          .insert({
            session_id: sessionId,

            path: pathname,

            page_title: document.title || null,

            referrer: document.referrer || null,

            device_type: getDeviceType(),

            browser: getBrowser(),

            operating_system: getOperatingSystem(),

            screen_width: window.screen.width,

            screen_height: window.screen.height,

            viewport_width: window.innerWidth,

            viewport_height: window.innerHeight,

            language: navigator.language || null,

            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
              null,

            connection_type: getConnectionType(),
          });

        if (error) {
          console.error(
            "Visitor analytics error:",
            error.message
          );
        }
      } catch (error) {
        console.error(
          "Visitor analytics failed:",
          error
        );
      }
    }

    trackPageView();
  }, [pathname]);

  return null;
}
