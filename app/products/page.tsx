"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, MessageCircle, Package, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  sale_price?: number | null;
  category_id?: string | null;
  image_url?: string | null;
  product_code?: string | null;
  views?: number | null;
  featured?: boolean | null;
  free_delivery?: boolean | null;
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

function getWhatsAppUrl(product: Product) {
  const message = `Hi Kollaam Buy e-Store 👋\n\nI am interested in:\n${product.name}\n\nPrice: ${formatPrice(product.sale_price ?? product.price)}\n\nProduct Code: ${product.product_code || "N/A"}\n\nPlease share more details and availability.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function getDiscount(product: Product) {
  if (product.sale_price && product.price && product.sale_price < product.price) {
    return Math.round(((product.price - product.sale_price) / product.price) * 100);
  }
  return 0;
}

function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const discount = getDiscount(product);
  const price = product.sale_price ?? product.price;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${product.slug || product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill
              className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" />
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
            <span className="absolute right-3 top-3 rounded-full bg-green-700 px-3 py-1 text-xs font-semibold text-white">
              Featured
            </span>
          )}
          {product.free_delivery && (
            <span className="absolute bottom-3 left-3 rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
              Free Delivery Across Kerala
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        {categoryName && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-green-700">{categoryName}</p>
        )}
        <Link href={`/product/${product.slug || product.id}`}>
          <h2 className="line-clamp-2 min-h-[44px] text-sm font-semibold text-gray-900 group-hover:text-green-700">
            {product.name}
          </h2>
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-green-800">{formatPrice(price)}</span>
          {discount > 0 && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <Eye size={13} />
          {product.views || 0} views
        </div>
        <a href={getWhatsAppUrl(product)} target="_blank" rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white hover:bg-green-800">
          <MessageCircle size={17} />
          Buy / Enquire
        </a>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from("products").select("*").eq("published", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name"),
      ]);
      setProducts((productsResult.data || []) as Product[]);
      setCategories((categoriesResult.data || []) as Category[]);
      setLoading(false);
    }
    loadData();
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((category) => { map[category.id] = category.name; });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => {
      const categoryName = product.category_id ? categoryMap[product.category_id] || "" : "";
      return (
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.product_code?.toLowerCase().includes(term) ||
        categoryName.toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryMap]);

  return (
    <main className="min-h-screen bg-[#f7f1e4] text-gray-900">
      <div className="bg-green-800 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        🚚 Free Delivery Across Kerala &nbsp; • &nbsp; Easy Enquiry on WhatsApp
      </div>

      <header className="border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex min-h-[92px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <Image src="/kollaam-logo.png" alt="Kollaam Buy e-Store" width={190} height={70}
              className="h-[64px] w-auto object-contain sm:h-[74px]" priority />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-bold text-green-800 hover:bg-green-50">
            <ArrowLeft size={17} />
            Back to Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Browse Everything</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">All Products</h1>
            <p className="mt-2 text-sm text-gray-500">Explore all currently published products from Kollaam Buy e-Store.</p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Search size={19} className="text-gray-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all products..." className="w-full bg-transparent text-sm outline-none" />
          </div>
        </div>

        <div className="mb-6 text-sm font-semibold text-gray-500">
          {loading ? "Loading products..." : `${filteredProducts.length} products`}
        </div>

        {!loading && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product}
                categoryName={product.category_id ? categoryMap[product.category_id] : undefined} />
            ))}
          </div>
        ) : !loading ? (
          <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm">
            <Search size={50} className="mx-auto text-gray-300" />
            <h2 className="mt-5 text-xl font-black">No products found</h2>
            <p className="mt-2 text-sm text-gray-500">Try another product name or category.</p>
          </div>
        ) : null}

        <div className="mt-10 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-green-800">
            Back to Home
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
