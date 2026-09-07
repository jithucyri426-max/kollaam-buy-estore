import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kollaam-buy-estore.vercel.app"),
  title: {
    default: "Kollaam Buy e-Store | Quality Products at Great Prices",
    template: "%s | Kollaam Buy e-Store",
  },
  description:
    "Shop quality products at great prices from Kollaam Buy e-Store. Browse fashion, electronics, beauty, home & kitchen, kids, gifts, watches and more. Easy WhatsApp enquiry and free delivery across Kerala.",
  keywords: [
    "Kollaam Buy e-Store",
    "Kollaam Buy",
    "online shopping Kerala",
    "online store Kerala",
    "shopping Kerala",
    "quality products Kerala",
    "fashion",
    "electronics",
    "beauty products",
    "home kitchen products",
    "kids products",
    "gifts",
    "watches",
    "mobile accessories",
  ],
  authors: [{ name: "Kollaam Buy e-Store" }],
  creator: "Kollaam Buy e-Store",
  publisher: "Kollaam Buy e-Store",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Kollaam Buy e-Store | Quality Products at Great Prices",
    description:
      "Browse quality products from Kollaam Buy e-Store with easy WhatsApp enquiry and free delivery across Kerala.",
    type: "website",
    siteName: "Kollaam Buy e-Store",
    locale: "en_IN",
    images: [
      {
        url: "/kollaam-logo.png",
        width: 190,
        height: 70,
        alt: "Kollaam Buy e-Store",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Kollaam Buy e-Store | Quality Products at Great Prices",
    description:
      "Quality products, great prices and easy shopping through Kollaam Buy e-Store.",
    images: ["/kollaam-logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

