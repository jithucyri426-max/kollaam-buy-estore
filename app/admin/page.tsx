"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  Eye,
  Globe,
  Laptop,
  Loader2,
  LogOut,
  MessageCircle,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageView = {
  id: string;
  session_id: string;
  path: string;
  page_title: string | null;
  referrer: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  screen_width: number | null;
  screen_height: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  language: string | null;
  timezone: string | null;
  connection_type: string | null;
  created_at: string;
};

type VisitorSession = {
  sessionId: string;
  events: PageView[];
  firstSeen: string;
  lastSeen: string;
  device: string;
  browser: string;
  operatingSystem: string;
  referrer: string | null;
};

const RANGE_OPTIONS = [
  { label: "24 Hours", value: 1 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(start: string, end: string) {
  const seconds = Math.max(
    0,
    Math.round(
      (new Date(end).getTime() -
        new Date(start).getTime()) /
        1000
    )
  );

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getSource(referrer: string | null) {
  if (!referrer) {
    return "Direct";
  }

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();

    if (
      hostname.includes("instagram") ||
      hostname.includes("facebook") ||
      hostname.includes("fb.com")
    ) {
      return "Facebook / Instagram";
    }

    if (
      hostname.includes("google") ||
      hostname.includes("bing") ||
      hostname.includes("yahoo")
    ) {
      return "Search";
    }

    if (
      hostname.includes("youtube") ||
      hostname.includes("youtu.be")
    ) {
      return "YouTube";
    }

    return hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

function DeviceIcon({
  device,
  size = 17,
}: {
  device: string;
  size?: number;
}) {
  if (device === "Mobile") {
    return <Smartphone size={size} />;
  }

  if (device === "Tablet") {
    return <Tablet size={size} />;
  }

  return <Monitor size={size} />;
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-3 text-green-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function RankingList({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-gray-900">
        {title}
      </h2>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No data yet
          </p>
        ) : (
          items.slice(0, 10).map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center gap-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {item.name}
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                {item.count}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [pageViews, setPageViews] =
    useState<PageView[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [rangeDays, setRangeDays] = useState(7);

  const [selectedVisitor, setSelectedVisitor] =
    useState<string | null>(null);

  async function checkAdmin() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAuthorized(false);
        setCheckingAuth(false);
        return;
      }

      const { data, error } =
        await supabase.rpc("is_admin");

      if (!error && data === true) {
        setAuthorized(true);
      } else {
        await supabase.auth.signOut();
        setAuthorized(false);
      }
    } catch {
      setAuthorized(false);
    }

    setCheckingAuth(false);
  }

  async function loadAnalytics(
    showRefresh = false
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const startDate = new Date();

    startDate.setDate(
      startDate.getDate() - rangeDays
    );

    const { data, error } = await supabase
      .from("visitor_pageviews")
      .select("*")
      .gte(
        "created_at",
        startDate.toISOString()
      )
      .order("created_at", {
        ascending: true,
      })
      .limit(10000);

    if (!error) {
      setPageViews(
        (data || []) as PageView[]
      );
    } else {
      console.error(
        "Analytics loading error:",
        error.message
      );
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (authorized) {
      loadAnalytics();
    }
  }, [authorized, rangeDays]);

  async function logout() {
    await supabase.auth.signOut();

    window.location.href = "/admin";
  }

  const visitorSessions = useMemo(() => {
    const map = new Map<
      string,
      VisitorSession
    >();

    for (const event of pageViews) {
      const existing = map.get(
        event.session_id
      );

      if (!existing) {
        map.set(event.session_id, {
          sessionId: event.session_id,
          events: [event],
          firstSeen: event.created_at,
          lastSeen: event.created_at,
          device:
            event.device_type || "Unknown",
          browser:
            event.browser || "Unknown",
          operatingSystem:
            event.operating_system ||
            "Unknown",
          referrer: event.referrer,
        });
      } else {
        existing.events.push(event);

        if (
          new Date(event.created_at).getTime() >
          new Date(existing.lastSeen).getTime()
        ) {
          existing.lastSeen =
            event.created_at;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastSeen).getTime() -
        new Date(a.lastSeen).getTime()
    );
  }, [pageViews]);

  const pageRanking = useMemo(() => {
    const counts: Record<string, number> = {};

    pageViews.forEach((view) => {
      counts[view.path] =
        (counts[view.path] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [pageViews]);

  const productRanking = useMemo(() => {
    const counts: Record<string, number> = {};

    pageViews.forEach((view) => {
      if (view.path.startsWith("/product/")) {
        counts[view.path] =
          (counts[view.path] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name: name.replace(
          "/product/",
          ""
        ),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [pageViews]);

  const sourceRanking = useMemo(() => {
    const counts: Record<string, number> = {};

    visitorSessions.forEach((visitor) => {
      const source = getSource(
        visitor.referrer
      );

      counts[source] =
        (counts[source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [visitorSessions]);

  const deviceRanking = useMemo(() => {
    const counts: Record<string, number> = {};

    visitorSessions.forEach((visitor) => {
      counts[visitor.device] =
        (counts[visitor.device] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [visitorSessions]);

  const browserRanking = useMemo(() => {
    const counts: Record<string, number> = {};

    visitorSessions.forEach((visitor) => {
      counts[visitor.browser] =
        (counts[visitor.browser] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [visitorSessions]);

  const activeVisitors = useMemo(() => {
    const fiveMinutesAgo =
      Date.now() - 5 * 60 * 1000;

    return visitorSessions.filter(
      (visitor) =>
        new Date(
          visitor.lastSeen
        ).getTime() >= fiveMinutesAgo
    ).length;
  }, [visitorSessions]);

  const mobileVisitors = visitorSessions.filter(
    (visitor) => visitor.device === "Mobile"
  ).length;

  const desktopVisitors = visitorSessions.filter(
    (visitor) => visitor.device === "Desktop"
  ).length;

  const tabletVisitors = visitorSessions.filter(
    (visitor) => visitor.device === "Tablet"
  ).length;

  const selectedSession =
    selectedVisitor
      ? visitorSessions.find(
          (visitor) =>
            visitor.sessionId ===
            selectedVisitor
        )
      : null;

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e4]">
        <Loader2
          className="animate-spin text-green-700"
          size={32}
        />
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e4] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-black text-gray-900">
            Admin Access Required
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please sign in through the admin
            panel to view analytics.
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white hover:bg-green-800"
          >
            Go to Admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f1e4] text-gray-900">
      {/* HEADER */}

      <header className="border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex min-h-[84px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Private Admin Area
            </p>

            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
              Visitor Analytics
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                loadAnalytics(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        {/* TOP CONTROLS */}

        <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              Visitor activity
            </p>

            <p className="text-xs text-gray-500">
              Showing the last{" "}
              {rangeDays === 1
                ? "24 hours"
                : `${rangeDays} days`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map(
              (option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setRangeDays(
                      option.value
                    )
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    rangeDays ===
                    option.value
                      ? "bg-green-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2
              size={34}
              className="animate-spin text-green-700"
            />
          </div>
        ) : (
          <>
            {/* STATISTICS */}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
              <StatCard
                title="Unique Visitors"
                value={
                  visitorSessions.length
                }
                icon={<Users size={22} />}
                description="Anonymous sessions"
              />

              <StatCard
                title="Page Views"
                value={pageViews.length}
                icon={<Eye size={22} />}
                description="Recorded visits"
              />

              <StatCard
                title="Active Now"
                value={activeVisitors}
                icon={
                  <BarChart3 size={22} />
                }
                description="Seen in last 5 minutes"
              />

              <StatCard
                title="Product Views"
                value={productRanking.reduce(
                  (total, item) =>
                    total + item.count,
                  0
                )}
                icon={
                  <Globe size={22} />
                }
                description="Product page visits"
              />
            </div>

            {/* DEVICE CARDS */}

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Smartphone size={18} />
                  <span className="text-xs font-bold uppercase">
                    Mobile
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black">
                  {mobileVisitors}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Monitor size={18} />
                  <span className="text-xs font-bold uppercase">
                    Desktop
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black">
                  {desktopVisitors}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Tablet size={18} />
                  <span className="text-xs font-bold uppercase">
                    Tablet
                  </span>
                </div>

                <p className="mt-2 text-2xl font-black">
                  {tabletVisitors}
                </p>
              </div>
            </div>

            {/* RANKINGS */}

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <RankingList
                title="Most Visited Pages"
                items={pageRanking}
              />

              <RankingList
                title="Most Viewed Products"
                items={productRanking}
              />

              <RankingList
                title="Traffic Sources"
                items={sourceRanking}
              />

              <RankingList
                title="Browsers"
                items={browserRanking}
              />
            </div>

            {/* VISITOR SESSIONS */}

            <section className="mt-7 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">
                      Visitor Sessions
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Click a visitor to inspect
                      their complete journey.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                    {visitorSessions.length} sessions
                  </span>
                </div>
              </div>

              {visitorSessions.length ===
              0 ? (
                <div className="p-12 text-center">
                  <Users
                    size={45}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-4 font-bold text-gray-700">
                    No visitor data yet
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Visitors will appear here
                    as they browse the store.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {visitorSessions.map(
                    (visitor, index) => (
                      <button
                        key={
                          visitor.sessionId
                        }
                        type="button"
                        onClick={() =>
                          setSelectedVisitor(
                            selectedVisitor ===
                              visitor.sessionId
                              ? null
                              : visitor.sessionId
                          )
                        }
                        className="w-full p-5 text-left transition hover:bg-gray-50"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-black text-green-700">
                              {index + 1}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-gray-900">
                                Visitor{" "}
                                {visitor.sessionId.slice(
                                  0,
                                  8
                                )}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {visitor.events.length} page
                                {visitor.events.length ===
                                1
                                  ? ""
                                  : "s"}{" "}
                                visited
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                  <DeviceIcon
                                    device={
                                      visitor.device
                                    }
                                    size={13}
                                  />
                                  {visitor.device}
                                </span>

                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                  {visitor.browser}
                                </span>

                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                  {getSource(
                                    visitor.referrer
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                            <div>
                              <p className="text-gray-400">
                                First Seen
                              </p>

                              <p className="mt-1 font-bold text-gray-700">
                                {formatDate(
                                  visitor.firstSeen
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400">
                                Last Seen
                              </p>

                              <p className="mt-1 font-bold text-gray-700">
                                {formatDate(
                                  visitor.lastSeen
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400">
                                Session
                              </p>

                              <p className="mt-1 font-bold text-gray-700">
                                {formatDuration(
                                  visitor.firstSeen,
                                  visitor.lastSeen
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* JOURNEY */}

                        {selectedVisitor ===
                          visitor.sessionId && (
                          <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black text-gray-800">
                                Visitor Journey
                              </span>

                              {visitor.operatingSystem && (
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500">
                                  {
                                    visitor.operatingSystem
                                  }
                                </span>
                              )}

                              {visitor.events[0]
                                ?.language && (
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500">
                                  {
                                    visitor.events[0]
                                      .language
                                  }
                                </span>
                              )}

                              {visitor.events[0]
                                ?.screen_width && (
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500">
                                  {
                                    visitor.events[0]
                                      .screen_width
                                  }
                                  ×
                                  {
                                    visitor.events[0]
                                      .screen_height
                                  }
                                </span>
                              )}
                            </div>

                            <div className="space-y-3">
                              {visitor.events.map(
                                (event, eventIndex) => (
                                  <div
                                    key={
                                      event.id
                                    }
                                    className="flex gap-3"
                                  >
                                    <div className="flex w-16 shrink-0 flex-col items-end">
                                      <span className="text-[11px] font-bold text-gray-400">
                                        {formatTime(
                                          event.created_at
                                        )}
                                      </span>
                                    </div>

                                    <div className="relative flex-1 rounded-xl border border-gray-200 bg-white p-3">
                                      <div className="absolute -left-[7px] top-3 h-3 w-3 rotate-45 border-b border-l border-gray-200 bg-white" />

                                      <p className="relative break-all text-sm font-bold text-gray-800">
                                        {event.path}
                                      </p>

                                      {event.page_title && (
                                        <p className="mt-1 truncate text-xs text-gray-400">
                                          {
                                            event.page_title
                                          }
                                        </p>
                                      )}

                                      {event.referrer && (
                                        <p className="mt-1 truncate text-xs text-gray-400">
                                          From:{" "}
                                          {
                                            event.referrer
                                          }
                                        </p>
                                      )}

                                      {event.connection_type &&
                                        event.connection_type !==
                                          "unknown" && (
                                          <p className="mt-1 text-xs text-gray-400">
                                            Connection:{" "}
                                            {
                                              event.connection_type
                                            }
                                          </p>
                                        )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </section>

            {/* FOOTER ACTIONS */}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
              >
                <ArrowLeft size={17} />
                Back to Admin
              </Link>

              <div className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-500 shadow-sm">
                <Clock3 size={17} />
                Analytics refreshes when you click
                Refresh
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-500 shadow-sm">
                <MessageCircle size={17} />
                WhatsApp tracking will be added
                next
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}