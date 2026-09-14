"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Smartphone, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Visitor = {
  id: string;
  session_id: string;
  path: string;
  device_type: string | null;
  device_model: string | null;
  operating_system: string | null;
  browser: string | null;
  screen_width: number | null;
  screen_height: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_meters: number | null;
  location_permission: boolean;
  location_consent_at: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DeviceAnalyticsPage() {
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
      .select("id,session_id,path,device_type,device_model,operating_system,browser,screen_width,screen_height,country,region,city,latitude,longitude,location_accuracy_meters,location_permission,location_consent_at,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (queryError) {
      setError(queryError.message);
    } else {
      setVisitors((data || []) as Visitor[]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (authorized) loadVisitors();
  }, [authorized]);

  const uniqueSessions = new Set(visitors.map((v) => v.session_id)).size;
  const mobile = visitors.filter((v) => v.device_type === "Mobile").length;
  const locationGranted = visitors.filter((v) => v.location_permission).length;
  const models = visitors.filter((v) => v.device_model).length;

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-24 text-gray-500">
          <Loader2 className="mr-2 animate-spin" size={20} /> Checking administrator access...
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-gray-900">Device Analytics</h1>
          <p className="mt-3 text-sm text-gray-500">{error || "Administrator access required."}</p>
          <Link href="/admin" className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white">Back to Admin</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/analytics" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
              <ArrowLeft size={16} /> Analytics
            </Link>
            <h1 className="text-3xl font-black text-gray-900">Device & Location Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">Best-effort device model and permission-based visitor location data.</p>
          </div>
          <button onClick={() => loadVisitors(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm disabled:opacity-60">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Page views</p><p className="mt-2 text-3xl font-black">{visitors.length}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Unique sessions</p><p className="mt-2 text-3xl font-black">{uniqueSessions}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Mobile views</p><p className="mt-2 text-3xl font-black">{mobile}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Location permission</p><p className="mt-2 text-3xl font-black">{locationGranted}</p></div>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Privacy:</strong> exact GPS is shown only when the visitor explicitly granted browser location permission. Device models are best-effort and may be unavailable on modern browsers. This data should not be treated as proof of a person's identity.
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div className="flex items-center gap-2"><Smartphone size={19} /><h2 className="text-lg font-black">Visitor devices</h2></div>
            <span className="text-xs font-semibold text-gray-400">Models available: {models}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500"><Loader2 className="mr-2 animate-spin" size={20} /> Loading...</div>
          ) : visitors.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No visitor data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">OS / Browser</th>
                    <th className="px-4 py-3">Screen</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">GPS</th>
                    <th className="px-4 py-3">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(visitor.created_at)}</td>
                      <td className="px-4 py-3"><div className="font-bold text-gray-900">{visitor.device_model || "Model unavailable"}</div><div className="text-xs text-gray-500">{visitor.device_type || "Unknown"}</div></td>
                      <td className="px-4 py-3"><div className="font-medium">{visitor.operating_system || "Unknown"}</div><div className="text-xs text-gray-500">{visitor.browser || "Unknown"}</div></td>
                      <td className="px-4 py-3 text-gray-600">{visitor.screen_width && visitor.screen_height ? `${visitor.screen_width} × ${visitor.screen_height}` : "—"}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1 font-medium"><MapPin size={14} />{[visitor.city, visitor.region, visitor.country].filter(Boolean).join(", ") || "Not available"}</div></td>
                      <td className="px-4 py-3">{visitor.location_permission && visitor.latitude != null && visitor.longitude != null ? <span className="text-green-700">Granted · ±{Math.round(visitor.location_accuracy_meters || 0)}m</span> : <span className="text-gray-400">Not granted</span>}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">{visitor.path}</td>
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
