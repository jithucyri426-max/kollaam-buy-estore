"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Heart,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  sale_price?: number | null;
  category_id?: string | null;
  image_url?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  product_code?: string | null;
  views?: number | null;
  featured?: boolean | null;
  published?: boolean | null;
  created_at: string;
};

const WHATSAPP_NUMBER = "918078342648";

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProductPrice(product: Product) {
  return product.sale_price ?? product.price;
}

function getDiscount(product: Product) {
  if (
    product.sale_price &&
    product.price &&
    product.sale_price < product.price
  ) {
    return Math.round(
      ((product.price - product.sale_price) / product.price) * 100
    );
  }

  return 0;
}

function getWhatsAppUrl(product: Product) {
  const message = `Hi Kollaam Buy e-Store 👋

I am interested in:

${product.name}

Price: ${formatPrice(getProductPrice(product))}

Product Code: ${product.product_code || "N/A"}

Please share more details and availability.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

function ProductCard({ product }: { product: Product }) {
  const discount = getDiscount(product);

  async function handleProductClick() {
    try {
      const key = `viewed-${product.id}`;

      if (typeof window !== "undefined") {
        const alreadyViewed = sessionStorage.getItem(key);

        if (!alreadyViewed) {
          await supabase.rpc("record_product_view", {
            p_product_id: product.id,
          });

          sessionStorage.setItem(key, "1");
        }
      }
    } catch {
      // Navigation should continue even if view tracking fails.
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/product/${product.slug || product.id}`}
        onClick={handleProductClick}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <Package size={55} strokeWidth={1.2} />
            </div>
          )}

          {discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
              {discount}% OFF
            </span>
          )}

          {product.featured && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-700 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles size={12} />
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link
          href={`/product/${product.slug || product.id}`}
          onClick={handleProductClick}
        >
          <h2 className="line-clamp-2 min-h-[44px] text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700">
            {product.name}
          </h2>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-green-800">
            {formatPrice(getProductPrice(product))}
          </span>

          {discount > 0 && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <Eye size={13} />
          {product.views || 0} views
        </div>

        <a
          href={getWhatsAppUrl(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-800"
        >
          <MessageCircle size={17} />
          Buy / Enquire
        </a>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    loadCategory();
  }, [slug]);

  async function loadCategory() {
    setLoading(true);

    const { data: categoryData } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!categoryData) {
      setCategory(null);
      setLoading(false);
      return;
    }

    setCategory(categoryData);

    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryData.id)
        .eq("published", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    if (productsResult.data) {
      setProducts(productsResult.data);
    }

    if (categoriesResult.data) {
      setAllCategories(categoriesResult.data);
    }

    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const term = search.trim().toLowerCase();

    if (term) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.product_code?.toLowerCase().includes(term)
      );
    }

    if (sort === "price-low") {
      result.sort(
        (a, b) => getProductPrice(a) - getProductPrice(b)
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) => getProductPrice(b) - getProductPrice(a)
      );
    }

    if (sort === "popular") {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [products, search, sort]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="h-10 bg-green-800" />

        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-gray-200" />

            <div className="mt-3 h-4 w-72 rounded bg-gray-200" />

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-2xl bg-white p-3">
                  <div className="aspect-square rounded-xl bg-gray-200" />
                  <div className="mt-4 h-4 rounded bg-gray-200" />
                  <div className="mt-2 h-5 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <Package
            size={60}
            strokeWidth={1}
            className="mx-auto text-gray-300"
          />

          <h1 className="mt-5 text-2xl font-black">
            Category not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            This category may no longer be available.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-800 px-6 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={17} />
            Back to Store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* TOP BAR */}
      <div className="bg-green-800 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        🚚 Free Delivery Across Kerala &nbsp; • &nbsp; Easy Enquiry on WhatsApp
      </div>

      {/* HEADER */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[82px] items-center gap-5">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2"
            >
              <Image
                src="/kollaam-logo.png"
                alt="Kollaam Buy e-Store"
                width={190}
                height={70}
                className="h-auto w-[145px] object-contain sm:w-[175px]"
              />
            </Link>

            <div className="mx-auto hidden max-w-2xl flex-1 md:block">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search in ${category.name}...`}
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-12 pr-5 text-sm outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-3">
              <button
                className="hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100 sm:block"
                aria-label="Wishlist"
              >
                <Heart size={22} />
              </button>

              <button
                className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
                aria-label="Cart"
              >
                <ShoppingCart size={22} />
              </button>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          <div className="pb-3 md:hidden">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${category.name}...`}
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-green-600 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-green-700">
            Home
          </Link>

          <span>/</span>

          <span className="font-semibold text-gray-800">
            {category.name}
          </span>
        </div>
      </div>

      {/* CATEGORY HERO */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-3xl bg-green-50">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-100" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-orange-100/70" />

          <div className="relative flex min-h-[190px] items-center justify-between gap-6 p-7 sm:p-10">
            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                Shop
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                {category.name}
              </h1>

              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Explore our latest {category.name.toLowerCase()} products.
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-green-800">
                <Package size={17} />
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </div>
            </div>

            {category.image_url && (
              <div className="relative hidden h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm sm:block">
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORY NAV */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allCategories.map((item) => (
            <Link
              key={item.id}
              href={`/category/${item.slug}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                item.id === category.id
                  ? "bg-green-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-800"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">
              {search
                ? `Search results in ${category.name}`
                : `All ${category.name}`}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-green-600"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-gray-50 px-6 py-20 text-center">
            <Search
              size={55}
              strokeWidth={1}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 text-xl font-black">
              No products found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {search
                ? "Try another search term."
                : "Products will appear here when they are added."}
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
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-green-100">
                <MessageCircle size={18} />
                EASY ENQUIRY
              </div>

              <h2 className="text-2xl font-black text-white">
                Need help choosing a product?
              </h2>

              <p className="mt-2 text-sm text-green-100">
                Message Kollaam Buy e-Store directly on WhatsApp.
              </p>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-green-800 shadow-lg"
            >
              <MessageCircle size={19} />
              Chat on WhatsApp
              <ArrowRight size={16} />
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
              © {new Date().getFullYear()} Kollaam Buy e-Store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}