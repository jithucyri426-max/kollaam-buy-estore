"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  ChevronRight,
  Star,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Sparkles,
  ArrowRight,
  Eye,
  Package,
} from "lucide-react";
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
  hero_image_url?: string | null;
  product_code?: string | null;
  views?: number | null;
  featured?: boolean | null;
  published?: boolean | null;
  created_at: string;
};

const WHATSAPP_NUMBER = "918078342648";

const WHATSAPP_GROUP =
  "https://chat.whatsapp.com/KZPQkReJWbvK6CgR3bMWKj";

const INSTAGRAM_URL =
  "https://www.instagram.com/kollaam_buy_estore/";

const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61593676995976";

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getWhatsAppUrl(product: Product) {
  const message = `Hi Kollaam Buy e-Store 👋

I am interested in:
${product.name}

Price: ${formatPrice(product.sale_price ?? product.price)}

Product Code: ${product.product_code || "N/A"}

Please share more details and availability.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
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

function ProductCard({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  const discount = getDiscount(product);

  const handleProductClick = async () => {
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
      // Do not interrupt navigation if view tracking fails.
    }
  };

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
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
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
        {categoryName && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-green-700">
            {categoryName}
          </p>
        )}

        <Link
  href={`/product/${product.slug || product.id}`}
  onClick={handleProductClick}

>
          <h3 className="line-clamp-2 min-h-[44px] text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700">
            {product.name}
          </h3>
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
};

function getCategoryImage(category: Category) {
  return category.image_url || categoryImageMap[category.slug] || null;
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-green-50">
        {getCategoryImage(category) ? (
          <Image
            src={getCategoryImage(category) as string}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package
              size={45}
              strokeWidth={1}
              className="text-green-200"
            />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
          <h3 className="text-sm font-bold text-white">{category.name}</h3>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),

        supabase
          .from("products")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false }),
      ]);

      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (productsResult.data) {
        setProducts(productsResult.data);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};

    categories.forEach((category) => {
      map[category.id] = category.name;
    });

    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      const categoryName = product.category_id
        ? categoryMap[product.category_id]
        : "";

      return (
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.product_code?.toLowerCase().includes(term) ||
        categoryName?.toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryMap]);

  const trendingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 8);
  }, [products]);

  const recentProducts = useMemo(() => {
    return products.slice(0, 8);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products.filter((product) => product.featured).slice(0, 8);
  }, [products]);

  /*
   * Hero product:
   * The admin panel automatically creates hero_image_url
   * by removing the original image background.
   *
   * We prefer featured products, then fall back to the
   * newest product.
   */
  const heroProduct = useMemo(() => {
    return (
      products.find(
        (product) => product.featured && product.hero_image_url
      ) ||
      products.find((product) => product.hero_image_url) ||
      products.find((product) => product.featured) ||
      products[0] ||
      null
    );
  }, [products]);

  const heroImage =
    heroProduct?.hero_image_url || heroProduct?.image_url || "";

  return (
    <main
      className="relative min-h-screen overflow-x-hidden text-gray-900"
      style={{
        backgroundColor: "#f7f1e4",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22)), url('/images/kollaam-watercolor-bg.png')",
        backgroundSize: "100% 100%, 100% auto",
        backgroundPosition: "top, top",
        backgroundRepeat: "no-repeat, repeat-y",
      }}
    >
      {/* TOP BAR */}
      <div className="bg-green-800 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        🚚 Free Delivery Across Kerala &nbsp; • &nbsp; Easy Enquiry on WhatsApp
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/92 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[92px] items-center gap-4">
            {/* MOBILE MENU */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>

            {/* LOGO */}
            <Link
              href="/"
              className="flex shrink-0 items-center"
            >
              <Image
                src="/kollaam-logo.png"
                alt="Kollaam Buy e-Store"
                width={190}
                height={70}
                className="h-[64px] w-auto object-contain sm:h-[74px]"
                priority
                loading="eager"
              />
            </Link>

            {/* SEARCH */}
            <div className="mx-auto hidden max-w-2xl flex-1 md:flex">
              <div className="relative w-full">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-12 pr-5 text-sm outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            {/* HEADER ACTIONS */}
            <div className="ml-auto flex items-center gap-1 sm:gap-3">
              <Link
                href="/admin"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 lg:flex"
              >
                <User size={20} />
                Login
              </Link>

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
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-green-600 focus:bg-white"
              />
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-7 overflow-x-auto border-t border-gray-50 py-3 lg:flex">
            <Link
              href="/"
              className="whitespace-nowrap text-sm font-bold text-green-800"
            >
              Home
            </Link>

            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="whitespace-nowrap text-sm font-medium text-gray-600 transition hover:text-green-700"
              >
                {category.name}
              </Link>
            ))}

            {categories.length > 8 && (
              <Link
                href="/categories"
                className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-orange-600"
              >
                More
                <ChevronRight size={15} />
              </Link>
            )}
          </nav>
        </div>

        {/* MOBILE NAV */}
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white lg:hidden">
            <div className="mx-auto max-w-[1400px] px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-800"
                >
                  Home
                </Link>

                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* SEARCH RESULT */}
      {search.trim() && (
        <section className="mx-auto max-w-[1400px] px-4 pb-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Search results for "{search}"
            </h2>

            <span className="text-sm text-gray-500">
              {filteredProducts.length} products
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={
                    product.category_id
                      ? categoryMap[product.category_id]
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/60 bg-white/75 px-6 py-16 text-center backdrop-blur-sm">
              <Search
                size={42}
                className="mx-auto text-gray-300"
              />
              <h3 className="mt-4 text-lg font-bold">
                No products found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try searching for another product.
              </p>
            </div>
          )}
        </section>
      )}

      {/* NORMAL HOMEPAGE */}
      {!search.trim() && (
        <>
          {/* HERO - REALISTIC KERALA PANORAMIC */}
          <section className="relative min-h-[390px] overflow-hidden sm:min-h-[440px] lg:min-h-[500px]">
            <Image
              src="/images/kollaam-hero-final.png"
              alt="Kerala backwaters with products from Kollaam Buy e-Store"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-white/82 via-white/48 to-white/8" />

            <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
              <div className="relative flex min-h-[390px] items-center py-7 sm:min-h-[440px] sm:py-10 lg:min-h-[500px] lg:py-12">
                <div className="relative z-20 max-w-[560px] pr-2 sm:pr-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-xs font-bold text-green-700 shadow-sm backdrop-blur">
                    <Sparkles size={15} />
                    Your Local Online Shopping Store
                  </div>

                  <h1 className="mt-5 text-3xl font-black leading-[1] tracking-tight sm:text-5xl text-[#164c35] lg:text-[64px]">
                    Quality Products
                    <br />
                    <span className="text-orange-500">Better Living</span>
                  </h1>

                  <p className="mt-5 max-w-[500px] text-sm leading-6 text-gray-700 sm:text-base sm:leading-7">
                    From everyday essentials to useful finds — Kollaam Buy e-Store
                    brings great products straight to your doorstep.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="#categories"
                      className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-orange-600"
                    >
                      Shop Now
                      <ChevronRight size={17} />
                    </a>

                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-green-700 px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-green-800"
                    >
                      <MessageCircle size={17} />
                      Enquire
                    </a>
                  </div>

                  <div className="mt-6 grid max-w-[520px] grid-cols-3 gap-2 sm:gap-2.5">
                    <div className="rounded-xl bg-white/88 px-2 py-2.5 shadow-sm backdrop-blur sm:px-3 sm:py-3">
                      <p className="text-base">🚚</p>
                      <p className="mt-1 text-[11px] font-bold text-gray-700">
                        Kerala-wide Delivery
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/88 px-2 py-2.5 shadow-sm backdrop-blur sm:px-3 sm:py-3">
                      <p className="text-base">✓</p>
                      <p className="mt-1 text-[11px] font-bold text-gray-700">
                        Quality Products
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/88 px-2 py-2.5 shadow-sm backdrop-blur sm:px-3 sm:py-3">
                      <p className="text-base">💬</p>
                      <p className="mt-1 text-[11px] font-bold text-gray-700">
                        Easy WhatsApp Order
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRUST BAR */}
          <section className="border-b border-white/60 bg-white/72 backdrop-blur-sm">
            <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-gray-100 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center gap-3 px-3 py-3">
                <Truck
                  size={27}
                  className="shrink-0 text-green-700"
                />
                <div>
                  <p className="text-sm font-bold">
                    Free Delivery
                  </p>
                  <p className="text-xs text-gray-500">
                    Across Kerala
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 px-3 py-3">
                <ShieldCheck
                  size={27}
                  className="shrink-0 text-green-700"
                />
                <div>
                  <p className="text-sm font-bold">
                    Trusted Shopping
                  </p>
                  <p className="text-xs text-gray-500">
                    Genuine products
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 px-3 py-3">
                <RotateCcw
                  size={27}
                  className="shrink-0 text-green-700"
                />
                <div>
                  <p className="text-sm font-bold">
                    Easy Enquiry
                  </p>
                  <p className="text-xs text-gray-500">
                    Quick WhatsApp support
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 px-3 py-3">
                <Headphones
                  size={27}
                  className="shrink-0 text-green-700"
                />
                <div>
                  <p className="text-sm font-bold">
                    Customer Support
                  </p>
                  <p className="text-xs text-gray-500">
                    We're here to help
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          {categories.length > 0 && (
            <section id="categories" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                    Explore
                  </p>

                  <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                    Shop by Category
                  </h2>
                </div>

                <Link
                  href="/categories"
                  className="flex items-center gap-1 text-sm font-bold text-green-700 hover:text-green-900"
                >
                  View All
                  <ChevronRight size={17} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
                {categories.slice(0, 12).map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                  />
                ))}
              </div>
            </section>
          )}

          {/* FEATURED PRODUCTS */}
          {featuredProducts.length > 0 && (
            <section className="border-y border-white/50 bg-white/28 py-12 sm:py-16 backdrop-blur-[1px]">
              <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                <div className="mb-7 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                      Handpicked
                    </p>

                    <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                      Featured Products
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={
                        product.category_id
                          ? categoryMap[product.category_id]
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* TRENDING */}
          {trendingProducts.length > 0 && (
            <section id="categories" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                    Popular Now
                  </p>

                  <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                    Trending Products
                  </h2>
                </div>

                <div className="hidden items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 sm:flex">
                  <Eye size={15} />
                  Based on product views
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {trendingProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={
                      product.category_id
                        ? categoryMap[product.category_id]
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* WHATSAPP PROMO */}
          <section className="mx-auto max-w-[1400px] px-4 pb-12 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-green-800 px-6 py-10 sm:px-10 lg:px-14">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-700" />

              <div className="absolute -bottom-32 right-32 h-72 w-72 rounded-full bg-green-900/50" />

              <div className="relative z-10 flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white">
                    <MessageCircle size={15} />
                    JOIN OUR COMMUNITY
                  </div>

                  <h2 className="text-2xl font-black text-white sm:text-3xl">
                    Don't Miss Our Latest Products
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-green-100 sm:text-base">
                    Join our WhatsApp group to get updates about
                    new products, offers and more.
                  </p>
                </div>

                <a
                  href={WHATSAPP_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-green-800 shadow-lg transition hover:bg-gray-100"
                >
                  <MessageCircle size={19} />
                  Join WhatsApp Group
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </section>

          {/* RECENTLY ADDED */}
          {recentProducts.length > 0 && (
            <section className="border-t border-white/50 bg-white/28 py-12 sm:py-16 backdrop-blur-[1px]">
              <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                <div className="mb-7 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
                      Fresh Arrivals
                    </p>

                    <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                      Recently Added
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                  {recentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categoryName={
                        product.category_id
                          ? categoryMap[product.category_id]
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* EMPTY STATE */}
          {!loading && products.length === 0 && (
            <section className="mx-auto max-w-[1400px] px-4 py-20 text-center sm:px-6 lg:px-8">
              <Package
                size={65}
                strokeWidth={1}
                className="mx-auto text-gray-300"
              />

              <h2 className="mt-5 text-2xl font-black">
                Products Coming Soon
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                We're adding exciting products to Kollaam Buy
                e-Store. Check back soon!
              </p>
            </section>
          )}
        </>
      )}

      {/* FOOTER */}
      <footer className="bg-gray-950 text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* BRAND */}
            <div>
              <Image
                src="/kollaam-logo.png"
                alt="Kollaam Buy e-Store"
                width={190}
                height={70}
                className="h-auto w-[170px] brightness-0 invert"
              />

              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
                Great products, great prices and simple shopping
                through Kollaam Buy e-Store.
              </p>

              <div className="mt-5 flex gap-3">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
                >
                  <span className="text-sm font-bold">IG</span>
                </a>

                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
                >
                 <span className="text-sm font-bold">f</span>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
                >
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

            {/* QUICK LINKS */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Quick Links
              </h3>

              <div className="mt-5 space-y-3 text-sm text-gray-400">
                <Link
                  href="/"
                  className="block hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/categories"
                  className="block hover:text-white"
                >
                  Categories
                </Link>

                <Link
                  href="/"
                  className="block hover:text-white"
                >
                  All Products
                </Link>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-white"
                >
                  Contact Us
                </a>
              </div>
            </div>

            {/* CATEGORIES */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Categories
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-400">
                {categories.slice(0, 10).map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="hover:text-white"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* CONTACT */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Get In Touch
              </h3>

              <p className="mt-5 text-sm leading-6 text-gray-400">
                Have a question about a product? Send us a message
                on WhatsApp and we'll help you.
              </p>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-500"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Kollaam Buy e-Store.
            All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
} 