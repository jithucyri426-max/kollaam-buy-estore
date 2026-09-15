"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

export default function CustomerProfileLink() {
  const pathname = usePathname();

  if (!pathname || pathname.startsWith("/admin") || pathname === "/customer-profile") {
    return null;
  }

  return (
    <Link
      href="/customer-profile"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-green-800 hover:shadow-xl"
      aria-label="Save your customer details"
    >
      <UserRound size={17} />
      <span className="hidden sm:inline">My Details</span>
    </Link>
  );
}
