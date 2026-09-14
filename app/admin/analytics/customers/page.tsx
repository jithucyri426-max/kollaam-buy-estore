"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Visitor = {
  id: string;
  session_id: string;
  path: string;
  page_title: string | null;
  device_type: string | null;
  device_model: string | null;
  operating_system: string | null;
  browser: string | null;
  screen_width: number | null;
  screen_height: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  location_permission: boolean;
  created_at: string;
};

type Customer = {
  sessionId: string;
  firstVisit: string;
  lastVisit: string;
  visits: number;
  pages: number;
  device: string;
  model: string;
  os: string;
  browser: string;
  location: string;
  segment: string;
};

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSegment(visits: number, pages: number) {
  if (pages >= 8 || visits >= 5) return "Highly engaged";
  if (visits >= 2) return "Returning visitor";
  if (pages >= 4) return "Engaged first visit";
  return "New visitor";
}

export default function CustomerAnalyticsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  async function checkAdmin() {
    setChecking(true);
    setError("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Please sign in through Admin first.");
      setChecking(false);
      return;
    }

    const { data, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || !(data === true || data === "true")) {
      setError("Administrator access could not be verified.");
      setChecking(false);
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }

  async function loadVisitors(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("visitor_pageviews")
      .select("id,session_id,path,page_title,device_type,device_model,operating_system,browser,screen_width,screen_height,country,region,city,location_permission,created_at")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (queryError) setError(queryError.message);
    else setVisitors((data || []) as Visitor[]);

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { checkAdmin(); }, []);
  useEffect(() => { if (authorized) loadVisitors(); }, [authorized]);

  const customers = useMemo<Customer[]>(() => {
    const grouped = new Map<string, Visitor[]>();
    for (const visitor of visitors) {
      const existing = grouped.get(visitor.session_id) || [];
      existing.push(visitor);
      grouped.set(visitor.session_id, existing);
    }

    return Array.from(grouped.entries()).map(([sessionId, events]) => {
      const sorted = [...events].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const pages = new Set(events.map((event) => event.path)).size;
      const location = [last.city, last.region, last.country].filter(Boolean).join(", ") || "Not available";

      return {
        sessionId,
        firstVisit: first.created_at,
        lastVisit: last.created_at,
        visits: events.length,
        pages,
        device: last.device_type || "Unknown",
        model: last.device_model || "Model unavailable",
        os: last.operating_system || "Unknown",
        browser: last.browser || "Unknown",
        location,
        segment: getSegment(events.length, pages),
      };
    }).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
  }, [visitors]);

  function exportCsv() {
    const header = [
      "Visitor ID", "First Visit", "Last Visit", "Page Views", "Unique Pages",
      "Device", "Device Model", "Operating System", "Browser", "Location", "Segment"
    ];
    const rows = customers.map((customer) => [
      customer.sessionId,
      customer.firstVisit,
      customer.lastVisit,
      customer.visits,
      customer.pages,
      customer.device,
      customer.model,
      customer.os,
      customer.browser,
      customer.location,
      customer.segment,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kollaam-visitor-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (checking) {
    return <main className="min-h-screen bg-gray-50 p-6"><div className="mx-auto flex max-w-7xl items-center justify-center py-24 text-gray-500"><Loader2 className="mr-2 animate-spin" size={20} /> Checking administrator access...</div></main>;
  }

  if (!authorized) {
    return <main className="min-h-screen bg-gray-50 p-6"><div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-black text-gray-900">Customer Analytics</h1><p className="mt-3 text-sm text-gray-500">{error || "Administrator access required."}</p><Link href="/admin" className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white">Back to Admin</Link></div></main>;
  }

  const highlyEngaged = customers.filter((customer) => customer.segment === "Highly engaged").length;
  const returning = customers.filter((customer) => customer.segment === "Returning visitor").length;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/analytics" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> Analytics</Link>
            <h1 className="text-3xl font-black text-gray-900">Customer Profiles</h1>
            <p className="mt-1 text-sm text-gray-500">Visitor-based profiles built from analytics sessions. These are not verified identities.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadVisitors(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm disabled:opacity-60"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
            <button onClick={exportCsv} disabled={!customers.length} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Download size={16} /> Export CSV</button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Visitor profiles</p><p className="mt-2 text-3xl font-black">{customers.length}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Returning</p><p className="mt-2 text-3xl font-black">{returning}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Highly engaged</p><p className="mt-2 text-3xl font-black">{highlyEngaged}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Page views</p><p className="mt-2 text-3xl font-black">{visitors.length}</p></div>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
          <Users size={18} className="mt-0.5 shrink-0" />
          <p><strong>Important:</strong> a session ID is an analytics identifier, not a person's name, phone number, email, or guaranteed identity. Real customer profiles should be joined later with voluntary checkout/account/order information.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500"><Loader2 className="mr-2 animate-spin" size={20} /> Loading visitor profiles...</div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No visitor data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Visitor</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3">Visits / Pages</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">OS / Browser</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Segment</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer.sessionId} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="font-bold text-gray-900">{customer.sessionId.slice(0, 12)}…</div><div className="text-xs text-gray-400">First: {formatDate(customer.firstVisit)}</div></td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(customer.lastVisit)}</td>
                      <td className="px-4 py-3 font-semibold">{customer.visits} / {customer.pages}</td>
                      <td className="px-4 py-3"><div className="font-semibold">{customer.model}</div><div className="text-xs text-gray-500">{customer.device}</div></td>
                      <td className="px-4 py-3"><div>{customer.os}</div><div className="text-xs text-gray-500">{customer.browser}</div></td>
                      <td className="px-4 py-3 text-gray-600">{customer.location}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">{customer.segment}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
