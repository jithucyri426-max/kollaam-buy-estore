import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, ShoppingBag, Tag } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import ProductGallery from "./ProductGallery";

type Product = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  hero_image_url: string | null;
  product_code: string | null;
  views: number | null;
  featured: boolean | null;
  published: boolean | null;
  free_delivery: boolean;
  created_at: string;
  category?: {
    name: string;
    slug: string;
  } | null;
};

const WHATSAPP_NUMBER = "918078342648";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getDiscount(product: Product) {
  if (
    !product.sale_price ||
    !product.price ||
    product.sale_price >= product.price
  ) {
    return 0;
  }

  return Math.round(
    ((product.price - product.sale_price) / product.price) * 100
  );
}

function getWhatsAppUrl(product: Product) {
  const message = `Hi Kollaam Buy e-Store 👋

I am interested in:
${product.name}

Price: ${formatPrice(product.sale_price ?? product.price)}
Product Code: ${product.product_code || "N/A"}

Please share more details and availability.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function getProduct(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const selectFields = `
    id,
    name,
    slug,
    description,
    price,
    sale_price,
    category_id,
    image_url,
    image_url_2,
    image_url_3,
    hero_image_url,
    product_code,
    views,
    featured,
    published,
    free_delivery,
    created_at,
    category:categories(name,slug)
  `;

  // Try the product slug first. This avoids comparing a text slug
  // such as "sabr" against the UUID id column in the same OR query.
  const { data: slugProduct } = await supabase
    .from("products")
    .select(selectFields)
    .eq("published", true)
    .ilike("slug", slug)
    .maybeSingle();

  if (slugProduct) {
    return {
      ...slugProduct,
      category: Array.isArray(slugProduct.category)
        ? slugProduct.category[0] || null
        : slugProduct.category || null,
    } as Product;
  }

  // If the URL contains a UUID instead of a slug, also support that.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      slug
    );

  if (isUuid) {
    const { data: idProduct } = await supabase
      .from("products")
      .select(selectFields)
      .eq("published", true)
      .eq("id", slug)
      .maybeSingle();

    return idProduct
      ? ({
          ...idProduct,
          category: Array.isArray(idProduct.category)
            ? idProduct.category[0] || null
            : idProduct.category || null,
        } as Product)
      : null;
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "This product is no longer available at Kollaam Buy e-Store.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const categoryName = product.category?.name;
  const seoTitle = `${product.name} | Kollaam Buy e-Store`;
  const seoDescription = `${product.name}${
    categoryName ? ` from ${categoryName}` : ""
  }. Shop at Kollaam Buy e-Store with easy WhatsApp enquiry and free delivery across India.`.slice(0, 160);
  const canonicalPath = `/product/${product.slug || slug}`;
  const seoImage = product.image_url || product.image_url_2 || product.hero_image_url;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      product.name,
      categoryName,
      product.product_code,
      "Kollaam Buy e-Store",
      "online shopping India",
      "buy online India",
    ].filter(Boolean) as string[],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "website",
      siteName: "Kollaam Buy e-Store",
      locale: "en_IN",
      url: canonicalPath,
      images: seoImage
        ? [
            {
              url: seoImage,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: seoImage ? [seoImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <main
        className="min-h-screen px-4 py-16 text-gray-900"
        style={{
          backgroundColor: "#f7f1e4",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22)), url('/images/kollaam-watercolor-bg.png')",
          backgroundSize: "100% auto",
          backgroundPosition: "top",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="mx-auto max-w-2xl rounded-3xl bg-white/90 p-8 text-center shadow-lg">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-[#00765c]" />
          <h1 className="text-2xl font-black">Product not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This product may have been removed or is no longer published.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00765c] px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={17} />
            Back to Store
          </Link>
        </div>
      </main>
    );
  }

  const discount = getDiscount(product);
  const mainImage =
    product.hero_image_url || product.image_url || product.image_url_2 || "";

  const gallery = [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
  ].filter(Boolean) as string[];

  if (mainImage && !gallery.includes(mainImage)) {
    gallery.unshift(mainImage);
  }

  const productUrl = `https://kollaam-buy-estore.vercel.app/product/${product.slug || slug}`;
  const productImage = [product.image_url, product.image_url_2, product.image_url_3]
    .filter(Boolean) as string[];
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: productImage.length > 0 ? productImage : undefined,
    sku: product.product_code || undefined,
    brand: {
      "@type": "Brand",
      name: "Kollaam Buy e-Store",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: product.sale_price ?? product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <main
      className="min-h-screen overflow-x-hidden text-gray-900"
      style={{
        backgroundColor: "#f7f1e4",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22)), url('/images/kollaam-watercolor-bg.png')",
        backgroundSize: "100% auto",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <header className="border-b border-white/70 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[74px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <Image
              src="/kollaam-logo.png"
              alt="Kollaam Buy e-Store"
              width={190}
              height={58}
              priority
              className="h-auto w-[150px] sm:w-[180px]"
            />
          </Link>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm"
          >
            <MessageCircle size={17} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white/85 px-4 py-2.5 text-sm font-bold text-[#00765c] shadow-sm transition hover:bg-white"
        >
          <ArrowLeft size={17} />
          Back to Store
        </Link>

        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/92 shadow-xl">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-gray-100 p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
              <ProductGallery
                productName={product.name}
                mainImage={mainImage}
                gallery={gallery}
                discount={discount}
              />
            </div>

            <div className="flex flex-col p-5 sm:p-7 lg:p-10">
              {product.category?.name && (
                <Link
                  href={`/category/${product.category.slug}`}
                  className="mb-3 inline-flex w-fit items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#18804a]"
                >
                  <Tag size={14} />
                  {product.category.name}
                </Link>
              )}

              <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                {product.name}
              </h1>

              {product.product_code && (
                <p className="mt-2 text-xs font-semibold text-gray-400">
                  Product Code: {product.product_code}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black text-[#00765c]">
                  {formatPrice(product.sale_price ?? product.price)}
                </span>

                {product.sale_price &&
                  product.sale_price < product.price && (
                    <span className="pb-1 text-lg text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}

                {discount > 0 && (
                  <span className="rounded-full bg-[#fff0e7] px-3 py-1 text-xs font-black text-[#f47b20]">
                    Save {discount}%
                  </span>
                )}
              </div>

              <div className="mt-5 h-px bg-gray-100" />

              <div className="mt-6">
                <h2 className="text-lg font-black text-slate-900">
                  Product Overview
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
                  {product.description || "No product description available."}
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f5faf7] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Delivery
                  </p>
                  <p className="mt-1 text-xs font-black text-[#00765c]">
                    {product.free_delivery
                      ? "Free Delivery Across Kerala"
                      : "Delivery Available Across India"}
                  </p>
                </div>

                <div className="rounded-xl bg-[#fff8ef] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Enquiry
                  </p>
                  <p className="mt-1 text-xs font-black text-[#f47b20]">
                    WhatsApp
                  </p>
                </div>

                <div className="rounded-xl bg-[#f4f7fb] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Views
                  </p>
                  <p className="mt-1 text-xs font-black text-slate-700">
                    {product.views || 0}
                  </p>
                </div>
              </div>

              <a
                href={getWhatsAppUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-[#1ebe5d]"
              >
                <MessageCircle size={21} />
                Enquire on WhatsApp
              </a>

              <p className="mt-3 text-center text-[11px] text-gray-400">
                Message us on WhatsApp for availability, delivery and ordering.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
