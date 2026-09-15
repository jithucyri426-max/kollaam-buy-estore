import Link from "next/link";
import { BarChart3, Monitor, UserRound, Users } from "lucide-react";

export default function AnalyticsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
          >
            <BarChart3 size={17} />
            Analytics
          </Link>
          <Link
            href="/admin/analytics/devices"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            <Monitor size={17} />
            Devices
          </Link>
          <Link
            href="/admin/analytics/customers"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            <Users size={17} />
            Customers
          </Link>
          <Link
            href="/admin/analytics/profiles"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            <UserRound size={17} />
            Profiles
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
