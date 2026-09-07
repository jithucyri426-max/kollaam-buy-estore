import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const siteUrl = "https://kollaam-buy-estore.vercel.app";

function validSlug(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("slug"),
    supabase.from("products").select("slug").eq("published", true),
  ]);

  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
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

  if (categories) {
    for (const category of categories) {
      if (validSlug(category.slug)) {
        pages.push({
          url: `${siteUrl}/category/${category.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  if (products) {
    for (const product of products) {
      if (validSlug(product.slug)) {
        pages.push({
          url: `${siteUrl}/product/${product.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  return pages.filter((page) => validSlug(page.url));
}