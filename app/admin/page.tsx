"use client";

import { useEffect, useState } from "react";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
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
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  free_delivery: boolean;
};

type ImageSlot = {
  file: File | null;
  preview: string;
  existingUrl: string;
};

function emptyImage(): ImageSlot {
  return {
    file: null,
    preview: "",
    existingUrl: "",
  };
}

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productCode, setProductCode] = useState("");

  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [freeDelivery, setFreeDelivery] = useState(false);

  const [image1, setImage1] = useState<ImageSlot>(emptyImage());
  const [image2, setImage2] = useState<ImageSlot>(emptyImage());
  const [image3, setImage3] = useState<ImageSlot>(emptyImage());

  const [saving, setSaving] = useState(false);
  const [processingBackground, setProcessingBackground] =
    useState(false);
  const [backgroundStatus, setBackgroundStatus] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoggedIn(false);
        setCheckingAuth(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");

      if (!error && data === true) {
        setLoggedIn(true);
        await loadAdminData();
      } else {
        await supabase.auth.signOut();
        setLoggedIn(false);
      }
    } catch {
      setLoggedIn(false);
    }

    setCheckingAuth(false);
  }

  async function login() {
    setLoginLoading(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    const { data: adminCheck, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || adminCheck !== true) {
      await supabase.auth.signOut();

      setLoginError(
        "This account does not have administrator access."
      );

      setLoginLoading(false);
      return;
    }

    setLoggedIn(true);
    setLoginLoading(false);

    await loadAdminData();
  }

  async function logout() {
    await supabase.auth.signOut();

    setLoggedIn(false);
    setProducts([]);
    setCategories([]);
    resetForm();
  }

  async function loadAdminData() {
    setLoadingProducts(true);

    const [productsResult, categoriesResult] =
      await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),
      ]);

    if (productsResult.error) {
      showMessage(
        productsResult.error.message,
        "error"
      );
    } else {
      setProducts(productsResult.data || []);
    }

    if (!categoriesResult.error) {
      setCategories(categoriesResult.data || []);
    }

    setLoadingProducts(false);
  }

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  function resetForm() {
    setEditingProduct(null);

    setName("");
    setDescription("");
    setPrice("");
    setSalePrice("");
    setCategoryId("");
    setProductCode("");

    setFeatured(false);
    setPublished(true);
    setFreeDelivery(false);

    setImage1(emptyImage());
    setImage2(emptyImage());
    setImage3(emptyImage());

    setBackgroundStatus("");
    setProcessingBackground(false);
  }

  function openNewProduct() {
    resetForm();
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);

    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));

    setSalePrice(
      product.sale_price !== null
        ? String(product.sale_price)
        : ""
    );

    setCategoryId(product.category_id || "");
    setProductCode(product.product_code || "");

    setFeatured(product.featured);
    setPublished(product.published);
    setFreeDelivery(product.free_delivery ?? false);

    setImage1({
      file: null,
      preview: product.image_url || "",
      existingUrl: product.image_url || "",
    });

    setImage2({
      file: null,
      preview: product.image_url_2 || "",
      existingUrl: product.image_url_2 || "",
    });

    setImage3({
      file: null,
      preview: product.image_url_3 || "",
      existingUrl: product.image_url_3 || "",
    });

    setBackgroundStatus(
      product.hero_image_url
        ? "Transparent Hero image already exists."
        : "Upload the main image again to generate a transparent Hero image."
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleImageChange(
    slot: 1 | 2 | 3,
    file: File | null
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage(
        "Please select an image file.",
        "error"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        "Image must be smaller than 5 MB.",
        "error"
      );
      return;
    }

    const preview = URL.createObjectURL(file);

    const newSlot: ImageSlot = {
      file,
      preview,
      existingUrl: "",
    };

    if (slot === 1) {
      setImage1(newSlot);

      setBackgroundStatus(
        "Ready to remove background when you save."
      );
    }

    if (slot === 2) {
      setImage2(newSlot);
    }

    if (slot === 3) {
      setImage3(newSlot);
    }
  }

  function clearImage(slot: 1 | 2 | 3) {
    if (slot === 1) {
      setImage1(emptyImage());
      setBackgroundStatus("");
    }

    if (slot === 2) {
      setImage2(emptyImage());
    }

    if (slot === 3) {
      setImage3(emptyImage());
    }
  }

  async function uploadToStorage(
    file: File,
    folder: string,
    extensionOverride?: string
  ) {
    const extension =
      extensionOverride ||
      file.name.split(".").pop()?.toLowerCase() ||
      "jpg";

    const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      throw new Error(
        `Image upload failed: ${error.message}`
      );
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function generateTransparentImage(
    file: File
  ) {
    setProcessingBackground(true);

    setBackgroundStatus(
      "AI is removing the product background..."
    );

    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        "/api/remove-background",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let message =
          "Background removal failed.";

        try {
          const data = await response.json();

          if (data?.error) {
            message = data.error;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error(
          "The background-removal service returned an empty image."
        );
      }

      setBackgroundStatus(
        "✓ Background removed successfully."
      );

      return blob;
    } catch (error) {
      console.error(
        "Background removal failed:",
        error
      );

      setBackgroundStatus(
        error instanceof Error
          ? `${error.message} The original image will still be used.`
          : "Background removal failed. The original image will still be used."
      );

      return null;
    } finally {
      setProcessingBackground(false);
    }
  }

  async function saveProduct() {
    if (!name.trim()) {
      showMessage(
        "Please enter a product name.",
        "error"
      );
      return;
    }

    if (!price || Number(price) <= 0) {
      showMessage(
        "Please enter a valid price.",
        "error"
      );
      return;
    }

    if (!categoryId) {
      showMessage(
        "Please select a category.",
        "error"
      );
      return;
    }

    if (!editingProduct && !image1.file) {
      showMessage(
        "Please upload the main product image.",
        "error"
      );
      return;
    }

    if (
      salePrice &&
      Number(salePrice) >= Number(price)
    ) {
      showMessage(
        "Sale price must be lower than regular price.",
        "error"
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let imageUrl =
        editingProduct?.image_url || null;

      let imageUrl2 =
        editingProduct?.image_url_2 || null;

      let imageUrl3 =
        editingProduct?.image_url_3 || null;

      let heroImageUrl =
        editingProduct?.hero_image_url || null;

      /*
       * MAIN PRODUCT IMAGE
       */

      if (image1.file) {
        imageUrl = await uploadToStorage(
          image1.file,
          "products"
        );

        /*
         * AUTOMATIC BACKGROUND REMOVAL
         */

        const transparentImage =
          await generateTransparentImage(
            image1.file
          );

        if (transparentImage) {
          const transparentFile = new File(
            [transparentImage],
            `${crypto.randomUUID()}.png`,
            {
              type: "image/png",
            }
          );

          heroImageUrl = await uploadToStorage(
            transparentFile,
            "hero",
            "png"
          );
        }
      }

      /*
       * IMAGE 2
       */

      if (image2.file) {
        imageUrl2 = await uploadToStorage(
          image2.file,
          "products"
        );
      }

      /*
       * IMAGE 3
       */

      if (image3.file) {
        imageUrl3 = await uploadToStorage(
          image3.file,
          "products"
        );
      }

      const productData = {
        name: name.trim(),
        slug:
          editingProduct?.slug ||
          createSlug(name),
        description:
          description.trim() || null,
        price: Number(price),
        sale_price:
          salePrice.trim() === ""
            ? null
            : Number(salePrice),
        category_id: categoryId,
        image_url: imageUrl,
        image_url_2: imageUrl2,
        image_url_3: imageUrl3,
        hero_image_url: heroImageUrl,
        product_code:
          productCode.trim() || null,
        featured,
        published,
        free_delivery: freeDelivery,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) {
          throw new Error(error.message);
        }

        showMessage(
          "Product updated successfully.",
          "success"
        );
      } else {
        const { error } = await supabase
          .from("products")
          .insert({
            ...productData,
            views: 0,
          });

        if (error) {
          throw new Error(error.message);
        }

        showMessage(
          "Product added successfully.",
          "success"
        );
      }

      resetForm();
      setShowForm(false);

      await loadAdminData();
    } catch (error: any) {
      console.error(error);

      showMessage(
        error?.message ||
          "Something went wrong while saving.",
        "error"
      );
    } finally {
      setSaving(false);
      setProcessingBackground(false);
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      showMessage(
        error.message,
        "error"
      );
      return;
    }

    showMessage(
      "Product deleted successfully.",
      "success"
    );

    await loadAdminData();
  }

  async function togglePublished(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({
        published: !product.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      showMessage(
        error.message,
        "error"
      );
      return;
    }

    await loadAdminData();
  }

  async function toggleFeatured(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({
        featured: !product.featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      showMessage(
        error.message,
        "error"
      );
      return;
    }

    await loadAdminData();
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2
          className="animate-spin text-[#005b48]"
          size={35}
        />
      </div>
    );
  }

  /*
   * LOGIN
   */

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#003e32] to-[#008b5a] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
          <div className="text-center">
            <img
              src="/kollaam-logo.png"
              alt="Kollaam Buy e-Store"
              className="mx-auto h-28 w-auto object-contain"
            />

            <h1 className="mt-5 text-2xl font-black text-[#003e32]">
              Admin Panel
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your Kollaam Buy e-Store
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Admin email"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    login();
                  }
                }}
                placeholder="Password"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {loginError}
              </div>
            )}

            <button
              onClick={login}
              disabled={loginLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff641c] font-bold text-white transition hover:bg-[#ed5310] disabled:opacity-60"
            >
              {loginLoading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {loginLoading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ADMIN PANEL
   */

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <img
              src="/kollaam-logo.png"
              alt="Kollaam Buy e-Store"
              className="h-12 w-auto object-contain sm:h-14"
            />

            <div className="hidden border-l border-slate-200 pl-4 sm:block">
              <div className="font-black text-[#005b48]">
                Admin Panel
              </div>

              <div className="text-xs text-slate-500">
                Product Management
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-50"
            >
              <RefreshCw size={17} />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              onClick={logout}
              className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <LogOut size={17} />

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {message && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-xl p-4 text-sm font-semibold ${
              messageType === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <XCircle size={19} />
            )}

            {message}
          </div>
        )}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black text-[#003e32]">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage products, images and Hero cutouts.
            </p>
          </div>

          <button
            onClick={openNewProduct}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#ff641c] px-5 py-3 font-bold text-white shadow-lg shadow-orange-100 hover:bg-[#ed5310]"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* FORM */}

        {showForm && (
          <section className="mb-8 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#003e32]">
                    {editingProduct
                      ? "Edit Product"
                      : "Add New Product"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    The main image automatically gets a
                    transparent Hero cutout.
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-2">
              {/* DETAILS */}

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    Product Name *
                  </label>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Example: SABR Watch"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    Category *
                  </label>

                  <select
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold">
                      Price *
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      placeholder="699"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-bold">
                      Sale Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={salePrice}
                      onChange={(event) =>
                        setSalePrice(event.target.value)
                      }
                      placeholder="399"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    Product Code
                  </label>

                  <input
                    value={productCode}
                    onChange={(event) =>
                      setProductCode(event.target.value)
                    }
                    placeholder="Example: SABR-001"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe the product..."
                    rows={6}
                    className="w-full resize-none rounded-xl border border-slate-200 p-4 outline-none focus:border-[#008b5a] focus:ring-4 focus:ring-[#008b5a]/10"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleCard
                    title="Published"
                    subtitle="Visible on storefront"
                    enabled={published}
                    onClick={() =>
                      setPublished(!published)
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setFeatured(!featured)
                    }
                    className={`flex items-center justify-between rounded-xl border p-4 text-left ${
                      featured
                        ? "border-orange-200 bg-orange-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-bold">
                        Featured
                      </div>

                      <div className="text-xs text-slate-500">
                        Prioritize in Hero
                      </div>
                    </div>

                    <Star
                      size={22}
                      className={
                        featured
                          ? "fill-orange-400 text-orange-400"
                          : "text-slate-400"
                      }
                    />
                  </button>
                </div>

                <div className="mt-3">
                  <ToggleCard
                    title="Free Delivery"
                    subtitle="Free delivery across Kerala"
                    enabled={freeDelivery}
                    onClick={() =>
                      setFreeDelivery(!freeDelivery)
                    }
                  />
                </div>
              </div>

              {/* IMAGES */}

              <div>
                <h3 className="font-black">
                  Product Images
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  JPG, PNG, WebP or GIF • Maximum 5 MB.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <ImageUploader
                    label="Main Image *"
                    slot={image1}
                    onChange={(file) =>
                      handleImageChange(1, file)
                    }
                    onClear={() => clearImage(1)}
                  />

                  <ImageUploader
                    label="Image 2"
                    slot={image2}
                    onChange={(file) =>
                      handleImageChange(2, file)
                    }
                    onClear={() => clearImage(2)}
                  />

                  <ImageUploader
                    label="Image 3"
                    slot={image3}
                    onChange={(file) =>
                      handleImageChange(3, file)
                    }
                    onClear={() => clearImage(3)}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-[#dceee6] bg-[#f1faf5] p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles
                      size={21}
                      className="mt-0.5 shrink-0 text-[#008b5a]"
                    />

                    <div>
                      <div className="font-bold text-[#005b48]">
                        Automatic Hero Cutout
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        The AI removes the background from
                        your main product image and saves a
                        transparent PNG for the Hero.
                      </p>

                      {processingBackground && (
                        <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#008b5a]">
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Removing background...
                        </div>
                      )}

                      {!processingBackground &&
                        backgroundStatus && (
                          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#008b5a]">
                            <CheckCircle2 size={16} />
                            {backgroundStatus}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={saveProduct}
                    disabled={
                      saving ||
                      processingBackground
                    }
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#008b5a] font-bold text-white shadow-lg shadow-green-100 hover:bg-[#007d50] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={19}
                          className="animate-spin"
                        />

                        {processingBackground
                          ? "Processing image..."
                          : "Saving..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={19} />

                        {editingProduct
                          ? "Update Product"
                          : "Save Product"}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="h-12 rounded-xl border border-slate-200 px-6 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PRODUCT LIST */}

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-xl font-black text-[#003e32]">
                Your Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {products.length} product
                {products.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              onClick={loadAdminData}
              className="flex items-center gap-2 text-sm font-bold text-[#008b5a]"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loadingProducts ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2
                size={35}
                className="animate-spin text-[#008b5a]"
              />
            </div>
          ) : products.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <ImageIcon
                size={45}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-xl font-bold">
                No products yet
              </h3>

              <button
                onClick={openNewProduct}
                className="mt-5 rounded-xl bg-[#ff641c] px-5 py-3 font-bold text-white"
              >
                Add Product
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products.map((product) => {
                const category = categories.find(
                  (item) =>
                    item.id === product.category_id
                );

                const discount =
                  product.sale_price &&
                  product.sale_price < product.price
                    ? Math.round(
                        ((product.price -
                          product.sale_price) /
                          product.price) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon
                            className="text-slate-300"
                            size={30}
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {product.name}
                        </h3>

                        {product.featured && (
                          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600">
                            <Star
                              size={11}
                              className="fill-orange-400"
                            />
                            Featured
                          </span>
                        )}

                        {product.hero_image_url && (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                            <Sparkles size={11} />
                            Hero Ready
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {category?.name ||
                          "No category"}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black text-[#ff3c1a]">
                          ₹
                          {product.sale_price ??
                            product.price}
                        </span>

                        {discount > 0 && (
                          <>
                            <span className="text-sm text-slate-400 line-through">
                              ₹{product.price}
                            </span>

                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              {discount}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {product.views || 0} views
                        </span>

                        {product.product_code && (
                          <span>
                            Code:{" "}
                            {product.product_code}
                          </span>
                        )}

                        <span
                          className={
                            product.published
                              ? "font-bold text-green-600"
                              : "font-bold text-red-500"
                          }
                        >
                          {product.published
                            ? "Published"
                            : "Hidden"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        onClick={() =>
                          togglePublished(product)
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                          product.published
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {product.published
                          ? "Published"
                          : "Publish"}
                      </button>

                      <button
                        onClick={() =>
                          toggleFeatured(product)
                        }
                        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${
                          product.featured
                            ? "bg-orange-50 text-orange-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Star
                          size={14}
                          className={
                            product.featured
                              ? "fill-orange-400"
                              : ""
                          }
                        />
                        Featured
                      </button>

                      <button
                        onClick={() =>
                          openEditProduct(product)
                        }
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(product)
                        }
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   TOGGLE
============================================================ */

function ToggleCard({
  title,
  subtitle,
  enabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border p-4 text-left ${
        enabled
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div>
        <div className="font-bold">{title}</div>

        <div className="text-xs text-slate-500">
          {subtitle}
        </div>
      </div>

      <div
        className={`h-6 w-11 rounded-full p-1 ${
          enabled
            ? "bg-green-500"
            : "bg-slate-300"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition ${
            enabled
              ? "translate-x-5"
              : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

/* ============================================================
   IMAGE UPLOADER
============================================================ */

function ImageUploader({
  label,
  slot,
  onChange,
  onClear,
}: {
  label: string;
  slot: ImageSlot;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold text-slate-600">
        {label}
      </div>

      <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#008b5a] hover:bg-green-50/30">
        {slot.preview ? (
          <>
            <img
              src={slot.preview}
              alt={label}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

            <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-center text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
              Click to replace
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClear();
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-lg"
            >
              <XCircle size={18} />
            </button>
          </>
        ) : (
          <div className="p-4 text-center">
            <Upload
              size={28}
              className="mx-auto text-slate-400"
            />

            <div className="mt-2 text-xs font-bold text-slate-500">
              Upload image
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            onChange(
              event.target.files?.[0] || null
            );

            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}