"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCustomerCart } from "@/app/components/customer-cart";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, isActiveCustomer } = useCustomerCart();

  return (
    <main className="min-h-screen bg-[#f7f1e4] px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-green-800">
          <ArrowLeft size={17} /> Back to Store
        </Link>

        <div className="mt-7 flex items-center gap-3">
          <ShoppingCart className="text-green-700" />
          <h1 className="text-3xl font-black">Your Cart</h1>
        </div>

        {!isActiveCustomer ? (
          <section className="mt-7 rounded-3xl bg-white p-8 text-center shadow-lg">
            <h2 className="text-xl font-black">Create your customer profile first</h2>
            <p className="mt-2 text-sm text-gray-500">Save your details to activate shopping and use your cart.</p>
            <Link href="/customer-profile" className="mt-6 inline-flex rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white">Create / Activate Profile</Link>
          </section>
        ) : items.length === 0 ? (
          <section className="mt-7 rounded-3xl bg-white p-12 text-center shadow-lg">
            <ShoppingCart className="mx-auto text-gray-300" size={52} />
            <h2 className="mt-4 text-xl font-black">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-500">Add products from the store to start your order.</p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white">Continue Shopping</Link>
          </section>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" sizes="96px" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${item.slug}`} className="font-bold hover:text-green-700">{item.name}</Link>
                    <p className="mt-1 font-black text-green-800">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="rounded-lg border p-2" aria-label="Decrease quantity"><Minus size={15} /></button>
                      <span className="min-w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="rounded-lg border p-2" aria-label="Increase quantity"><Plus size={15} /></button>
                      <button onClick={() => removeItem(item.productId)} className="ml-2 rounded-lg p-2 text-red-500" aria-label="Remove item"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <aside className="h-fit rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="text-lg font-black">Order Summary</h2>
              <div className="mt-5 flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="my-5 h-px bg-gray-100" />
              <div className="flex justify-between text-lg font-black"><span>Total</span><span className="text-green-800">{formatPrice(subtotal)}</span></div>
              <Link href="/checkout" className="mt-6 flex w-full items-center justify-center rounded-xl bg-green-700 px-5 py-3.5 text-sm font-black text-white transition hover:bg-green-800">Proceed to Checkout</Link>
              <p className="mt-3 text-center text-xs text-gray-400">Enter your delivery details to continue with your order.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
