"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "kollaam_analytics_session";
const LAST_ACTIVITY_KEY = "kollaam_analytics_last_activity";
const LOCATION_PROMPT_KEY = "kollaam_location_prompted";
const SESSION_TIMEOUT = 30 * 60 * 1000;

type LocationData = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permission: boolean;
  consentAt: string | null;
};

function getSessionId() {
  const now = Date.now();
  let sessionId = localStorage.getItem(SESSION_KEY);
  const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || "0");

  if (!sessionId || !lastActivity || now - lastActivity > SESSION_TIMEOUT) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
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
  if (/Tablet|iPad/i.test(ua) || (width >= 768 && width < 1024)) return "Tablet";
  if (/Mobile|Android|iPhone/i.test(ua) || width < 768) return "Mobile";
  return "Desktop";
}

async function getDeviceModel(): Promise<string | null> {
  const nav = navigator as Navigator & {
    userAgentData?: {
      getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }>;
    };
  };

  try {
    if (nav.userAgentData?.getHighEntropyValues) {
      const data = await nav.userAgentData.getHighEntropyValues(["model"]);
      if (data.model) return data.model;
    }
  } catch {
    // Device model is best-effort and may be hidden by the browser.
  }

  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  return null;
}

function getConnectionType() {
  const navigatorWithConnection = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  return navigatorWithConnection.connection?.effectiveType || "unknown";
}

function getReferrer() {
  try {
    return document.referrer || null;
  } catch {
    return null;
  }
}

function getStoredLocation(): LocationData {
  return {
    latitude: null,
    longitude: null,
    accuracy: null,
    permission: false,
    consentAt: null,
  };
}

function requestLocation(): Promise<LocationData> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(getStoredLocation());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          permission: true,
          consentAt: new Date().toISOString(),
        });
      },
      () => resolve(getStoredLocation()),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (trackedPathRef.current === pathname) return;
    trackedPathRef.current = pathname;

    async function recordVisit() {
      try {
        const sessionId = getSessionId();
        await new Promise((resolve) => window.setTimeout(resolve, 50));

        const pageTitle = document.title || pathname;
        const referrer = getReferrer();
        const deviceModel = await getDeviceModel();

        let location = getStoredLocation();
        const alreadyPrompted = localStorage.getItem(LOCATION_PROMPT_KEY) === "true";

        // Location is requested only once and only through the browser's permission dialog.
        if (!alreadyPrompted && navigator.geolocation) {
          localStorage.setItem(LOCATION_PROMPT_KEY, "true");
          location = await requestLocation();
        }

        const { error } = await supabase.from("visitor_pageviews").insert({
          session_id: sessionId,
          path: pathname,
          page_title: pageTitle,
          referrer,
          device_type: getDeviceType(),
          device_model: deviceModel,
          browser: getBrowser(),
          operating_system: getOperatingSystem(),
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          language: navigator.language || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          connection_type: getConnectionType(),
          latitude: location.latitude,
          longitude: location.longitude,
          location_accuracy_meters: location.accuracy,
          location_permission: location.permission,
          location_consent_at: location.consentAt,
        });

        if (error) {
          console.error("Kollaam analytics error:", error.message);
          return;
        }

        console.log(`[Kollaam Analytics] ${pathname}`);
      } catch (error) {
        console.error("Kollaam visitor tracking failed:", error);
      }
    }

    recordVisit();
  }, [pathname]);

  return null;
}
