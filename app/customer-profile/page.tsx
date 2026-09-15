"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageCircle, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "kollaam_analytics_session";
const ACTIVE_PROFILE_KEY = "kollaam_customer_profile_active";
const PROFILE_SESSION_KEY = "kollaam_customer_profile_session";
const SESSION_TIMEOUT = 30 * 60 * 1000;

function getSessionId() {
  const now = Date.now();
  let sessionId = localStorage.getItem(SESSION_KEY);
  const lastActivity = Number(
    localStorage.getItem("kollaam_analytics_last_activity") || "0"
  );

  if (!sessionId || !lastActivity || now - lastActivity > SESSION_TIMEOUT) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  localStorage.setItem("kollaam_analytics_last_activity", String(now));
  return sessionId;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);

    if (!sessionId) {
      setError("Please refresh the page and try again.");
      return;
    }

    if (!name.trim() && !email.trim() && !phone.trim()) {
      setError("Please enter at least one detail.");
      return;
    }

    setLoading(true);

    const { error: saveError } = await supabase.rpc("save_customer_profile", {
      p_session_id: sessionId,
      p_name: name.trim() || null,
      p_email: email.trim() || null,
      p_phone: phone.trim() || null,
      p_marketing_consent: marketingConsent,
    });

    setLoading(false);

    if (saveError) {
      console.error("Customer profile save failed:", saveError.message);
      setError("We couldn't save your details right now. Please try again.");
      return;
    }

    localStorage.setItem(ACTIVE_PROFILE_KEY, "true");
    localStorage.setItem(PROFILE_SESSION_KEY, sessionId);
    setSaved(true);

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#f7f1e4] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-green-800 hover:text-green-950"
        >
          <ArrowLeft size={17} />
          Back to Kollaam Buy e-Store
        </Link>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">
          <div className="bg-green-800 px-6 py-8 text-white sm:px-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <UserRound size={25} />
            </div>
            <h1 className="mt-5 text-2xl font-black sm:text-3xl">
              Your Customer Details
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-green-100">
              Save your details so we can recognize your visits and connect
              future enquiries or orders to the same customer profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-8 sm:px-10">
            <div>
              <label htmlFor="name" className="text-sm font-bold text-gray-800">
                Name <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={120}
                placeholder="Your name"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-bold text-gray-800">
                WhatsApp / Phone <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                maxLength={30}
                inputMode="tel"
                placeholder="Your phone number"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-bold text-gray-800">
                Email <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-green-700"
              />
              <span>
                <span className="block text-sm font-bold text-gray-800">
                  I want to receive offers and product updates
                </span>
                <span className="mt-1 block text-xs leading-5 text-gray-500">
                  This is optional. Your details are not sold to advertisers.
                </span>
              </span>
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                <span>Your details were saved successfully.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !sessionId}
              className="w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save My Details"}
            </button>

            <a
              href="https://wa.me/918078342648"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5 text-sm font-bold text-green-800 transition hover:bg-green-100"
            >
              <MessageCircle size={18} />
              Continue on WhatsApp
            </a>

            <p className="text-center text-xs leading-5 text-gray-400">
              Providing your details is voluntary. Your profile is linked to
              this browser's analytics session and is not proof of identity.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
