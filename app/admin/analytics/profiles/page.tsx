"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Mail, Phone, RefreshCw, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CustomerProfile = {
  id: string;
  session_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function escapeCsv(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export default function CustomerProfilesPage() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfiles() {
    setLoading(true);
    setError("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("Please sign in as an administrator.");
      setLoading(false);
      return;
    }

    const { data: adminData, error: adminError } = await supabase.rpc("is_admin");

    if (adminError || !adminData) {
      setError("Administrator access is required.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("customer_profiles")
      .select(
        "id,session_id,name,email,phone,marketing_consent,marketing_consent_at,created_at,updated_at"
      )
      .order("updated_at", { ascending: false });

    if (queryError) {
      console.error("Customer profiles load failed:", queryError.message);
      setError(
        "Customer profiles are not available yet. Run supabase/customer_profiles.sql in your Supabase SQL Editor, then refresh."
      );
      setProfiles([]);
      setLoading(false);
      return;
    }

    setProfiles((data || []) as CustomerProfile[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const marketingCount = useMemo(
    () => profiles.filter((profile) => profile.marketing_consent).length,
    [profiles]
  );

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Marketing Consent",
      "Marketing Consent At",
      "Profile Created",
      "Profile Updated",
      "Analytics Session",
    ];

    const rows = profiles.map((profile) => [
      profile.name,
      profile.email,
      profile.phone,
      profile.marketing_consent ? "Yes" : "No",
      profile.marketing_consent_at,
      profile.created_at,
      profile.updated_at,
      profile.session_id,
    ]);

    const csv = [
      header.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kollaam-customer-profiles-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-green-700">
              Customer Data
            </p>
            <h1 className="mt-1 text-3xl font-black text-gray-950">
              Customer Profiles
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Voluntary customer details linked to analytics sessions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadProfiles}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={profiles.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Profiles
            </p>
            <p className="mt-2 text-3xl font-black text-gray-950">{profiles.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Marketing Opt-ins
            </p>
            <p className="mt-2 text-3xl font-black text-green-700">{marketingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Available Contact Details
            </p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {profiles.filter((profile) => profile.phone || profile.email).length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm leading-6 text-orange-800">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 font-bold text-gray-600">Customer</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Contact</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Marketing</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Profile</th>
                  <th className="px-5 py-4 font-bold text-gray-600">Analytics Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="align-top hover:bg-gray-50/70">
                    <td className="px-5 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                          <UserRound size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{profile.name || "Unnamed customer"}</p>
                          <p className="mt-1 text-xs text-gray-400">ID: {profile.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="space-y-2">
                        {profile.phone ? (
                          <p className="flex items-center gap-2 text-gray-700">
                            <Phone size={14} /> {profile.phone}
                          </p>
                        ) : null}
                        {profile.email ? (
                          <p className="flex items-center gap-2 text-gray-700">
                            <Mail size={14} /> {profile.email}
                          </p>
                        ) : null}
                        {!profile.phone && !profile.email ? (
                          <span className="text-gray-400">No contact supplied</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          profile.marketing_consent
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {profile.marketing_consent ? "Opted in" : "No"}
                      </span>
                      {profile.marketing_consent_at && (
                        <p className="mt-2 text-xs text-gray-400">
                          {formatDate(profile.marketing_consent_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-5 text-xs text-gray-500">
                      <p>Created: {formatDate(profile.created_at)}</p>
                      <p className="mt-1">Updated: {formatDate(profile.updated_at)}</p>
                    </td>
                    <td className="px-5 py-5 font-mono text-xs text-gray-400">
                      {profile.session_id}
                    </td>
                  </tr>
                ))}

                {!loading && profiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-gray-400">
                      <UserRound size={36} className="mx-auto text-gray-300" />
                      <p className="mt-3 font-bold text-gray-600">No customer profiles yet</p>
                      <p className="mt-1 text-xs">
                        Customers can voluntarily save their details from the My Details button.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-gray-400">
          Privacy: customers choose whether to provide these details. An analytics session ID is not proof of identity. Only use marketing opt-ins for communications the customer has consented to receive.
        </p>
      </div>
    </main>
  );
}
