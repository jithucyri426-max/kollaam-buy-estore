"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import { useCustomerCart } from "@/app/components/customer-cart";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, isActiveCustomer } = useCustomerCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) {
      router.push("/cart");
      return;
    }
    // Order creation will be connected in the next checkout stage.
    alert("Your checkout details are ready. Order placement will be connected next.");
  };

  if (!isActiveCustomer) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4" size={42} />
          <h1 className="text-2xl font-black">Customer details required</h1>
          <p className="mt-2 text-gray-600">Please activate your customer profile before checkout.</p>
          <Link href="/customer-profile" className="mt-6 inline-flex rounded-xl bg-green-800 px-6 py-3 font-bold text-white">Go to My Details</Link>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4" size={42} />
          <h1 className="text-2xl font-black">Your cart is empty</h1>
          <p className="mt-2 text-gray-600">Add products to your cart before checkout.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-green-800 px-6 py-3 font-bold text-white">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/cart" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-green-800 hover:underline"><ArrowLeft size={17} /> Back to Cart</Link>
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
          <p className="mt-1 text-gray-600">Enter your delivery details for this order.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">Delivery Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Full name *</span><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="Your full name" /></label>
              <label><span className="mb-1 block text-sm font-bold">Phone *</span><input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="10-digit phone number" /></label>
              <label><span className="mb-1 block text-sm font-bold">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="you@example.com" /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Delivery address *</span><textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="House / building, street, locality" /></label>
              <label><span className="mb-1 block text-sm font-bold">City / Town *</span><input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="City or town" /></label>
              <label><span className="mb-1 block text-sm font-bold">PIN code *</span><input required inputMode="numeric" pattern="[0-9]{6}" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="6-digit PIN" /></label>
              <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Order notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2" placeholder="Optional delivery instructions" /></label>
            </div>
            <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 py-4 text-base font-black text-white transition hover:bg-green-900"><CheckCircle2 size={19} /> Continue to Place Order</button>
          </form>

          <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">Order Summary</h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 border-b pb-4">
                  <div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p></div>
                  <p className="font-black">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t pt-5 text-lg"><span className="font-bold">Subtotal</span><span className="font-black">₹{subtotal.toLocaleString("en-IN")}</span></div>
            <p className="mt-3 text-xs leading-5 text-gray-500">Delivery charges and final order confirmation will be handled when order placement is connected.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
