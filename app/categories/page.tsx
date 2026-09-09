"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Package,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
};

const categoryImageMap: Record<string, string> = {
  "bags-accessories": "/category-bags-accessories.png",
  "beauty-personal-care": "/category-beauty-personal-care.png",
  "books-stationery": "/category-books-stationery.png",
  electronics: "/category-electronics.png",
  fashion: "/category-fashion.png",
  gifts: "/category-gifts.png",
  "home-kitchen": "/category-home-kitchen.png",
  kids: "/category-kids.png",
  "mobile-accessories": "/category-mobile-accessories.png",
  "sports-fitness": "/category-sports-fitness.png",
  watches: "/category-watches.png",
  other: "/category-other.png",
  "headphones-earbuds": "/category-headphones-earbuds.png",
};

function getCategoryImage(category: Category) {
  return category.image_url || categoryImageMap[category.slug] || null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);

    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    

    setLoading(false);
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* TOP BAR */}
      <div className="bg-green-800 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        🚚 Free Delivery Across Kerala &nbsp; • &nbsp; Easy Enquiry on WhatsApp
      </div>

      {/* HEADER */}
      <header className="relative border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[82px] items-center gap-5">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-gray-700 transition hover:text-green-700"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <Link
              href="/"
              className="flex shrink-0 items-center"
            >
              <Image
                src="/kollaam-logo.png"
                alt="Kollaam Buy e-Store"
                width={210}
                height={78}
                className="h-auto w-[150px] object-contain sm:w-[175px] md:w-[190px]"
                priority
              />
            </Link>

            <div className="ml-auto">
              <a
                href="https://wa.me/918078342648"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-800 transition hover:bg-green-100"
              >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE HEADER */}
      <section className="bg-[#f5f8f2]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
              Explore
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl lg:text-5xl">
              Shop by Category
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              Browse all categories and discover products available at
              Kollaam Buy e-Store.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative mt-7 max-w-xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-full border border-gray-200 bg-white py-3.5 pl-12 pr-5 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            <div className="mb-7 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">
                  All Categories
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredCategories.length}{" "}
                  {filteredCategories.length === 1
                    ? "category"
                    : "categories"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-green-50 sm:aspect-[4/3]">
                    {getCategoryImage(category) ? (
                      <Image
                        src={getCategoryImage(category)!}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        onError={(event) => {
                          const fallback = categoryImageMap[category.slug];
                          if (
                            fallback &&
                            event.currentTarget.src !==
                              new URL(fallback, window.location.origin).href
                          ) {
                            event.currentTarget.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package
                          size={50}
                          strokeWidth={1}
                          className="text-green-200"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-sm font-bold text-white">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <span className="text-xs font-semibold text-gray-500">
                      Browse Products
                    </span>

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-700 transition group-hover:bg-green-700 group-hover:text-white">
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <Search
              size={55}
              strokeWidth={1}
              className="mx-auto text-gray-300"
            />

            <h2 className="mt-5 text-2xl font-black">
              No categories found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try searching for a different category.
            </p>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-5 rounded-full bg-green-800 px-6 py-3 text-sm font-bold text-white"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

      {/* WHATSAPP */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-green-800 px-6 py-9 sm:px-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-700" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-green-100">
                Need Help?
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Can't find what you're looking for?
              </h2>

              <p className="mt-2 text-sm text-green-100">
                Contact Kollaam Buy e-Store on WhatsApp.
              </p>
            </div>

            <a
              href="https://wa.me/918078342648"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-green-800 shadow-lg transition hover:bg-gray-100"
            >
              <MessageCircle size={19} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row">
            <Image
              src="/kollaam-logo.png"
              alt="Kollaam Buy e-Store"
              width={180}
              height={70}
              className="w-[160px] brightness-0 invert"
            />

            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Kollaam Buy e-Store. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}