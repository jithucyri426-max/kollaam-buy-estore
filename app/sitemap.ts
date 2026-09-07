import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://kollaam-buy-estore.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("slug"),
    supabase.from("products").select("slug").eq("published", true),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = (categories || [])
    .filter((category) => category.slug)
    .map((category) => ({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const productPages: MetadataRoute.Sitemap = (products || [])
    .filter((product) => product.slug)
    .map((product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...productPages];
}
