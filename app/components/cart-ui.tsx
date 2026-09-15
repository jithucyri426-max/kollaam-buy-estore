"use client";

import { useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCustomerCart } from "./customer-cart";

export default function CartUi() {
  const { itemCount, isActiveCustomer, addItem } = useCustomerCart();

  useEffect(() => {
    const addButtons = () => {
      const cards = Array.from(document.querySelectorAll("div.group.relative.overflow-hidden"));

      cards.forEach((card) => {
        if (card.querySelector("[data-kollaam-add-cart]")) return;
        const productLink = card.querySelector<HTMLAnchorElement>('a[href^="/product/"]');
        const whatsappLink = card.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]');
        if (!productLink || !whatsappLink) return;

        const slug = productLink.getAttribute("href")?.replace("/product/", "");
        if (!slug) return;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.kollaamAddCart = "1";
        button.className = "mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-green-700 bg-white px-3 py-3 text-sm font-bold text-green-800 transition hover:bg-green-50";
        button.textContent = "Add to Cart";

        button.addEventListener("click", async () => {
          if (!isActiveCustomer) {
            window.location.href = "/customer-profile";
            return;
          }

          button.disabled = true;
          button.textContent = "Adding...";

          const { data } = await supabase
            .from("products")
            .select("id,name,slug,price,sale_price,image_url")
            .eq("published", true)
            .ilike("slug", slug)
            .maybeSingle();

          if (!data) {
            button.disabled = false;
            button.textContent = "Add to Cart";
            return;
          }

          const added = addItem({
            productId: data.id,
            name: data.name,
            slug: data.slug || slug,
            price: data.sale_price ?? data.price,
            imageUrl: data.image_url || null,
          });

          button.textContent = added ? "Added ✓" : "Add to Cart";
          window.dispatchEvent(new Event("kollaam-cart-updated"));
          setTimeout(() => {
            button.disabled = false;
            button.textContent = "Add to Cart";
          }, 900);
        });

        whatsappLink.parentElement?.insertBefore(button, whatsappLink);
      });
    };

    addButtons();
    const observer = new MutationObserver(addButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isActiveCustomer, addItem]);

  return (
    <Link href="/cart" className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-3.5 text-sm font-black text-white shadow-2xl transition hover:bg-green-900">
      <ShoppingCart size={19} />
      Cart
      {itemCount > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs">{itemCount}</span>}
    </Link>
  );
}
