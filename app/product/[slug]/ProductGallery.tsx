"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, ShoppingBag, X } from "lucide-react";

type ProductGalleryProps = {
  productName: string;
  mainImage: string;
  gallery: string[];
  discount: number;
};

export default function ProductGallery({
  productName,
  mainImage,
  gallery,
  discount,
}: ProductGalleryProps) {
  const images = gallery.length ? gallery : mainImage ? [mainImage] : [];
  const initialIndex = Math.max(
    0,
    images.findIndex((image) => image === mainImage)
  );

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const selectedImage = images[selectedIndex] || mainImage;

  function previousImage() {
    if (images.length < 2) return;
    setSelectedIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function nextImage() {
    if (images.length < 2) return;
    setSelectedIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  return (
    <>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f7f8f6]">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={`${productName} view ${selectedIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-contain p-4 sm:p-8"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-20 w-20 text-gray-300" />
          </div>
        )}

        {discount > 0 && (
          <span className="absolute left-4 top-4 rounded-full bg-[#f47b20] px-3 py-1.5 text-xs font-black text-white">
            {discount}% OFF
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous product image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
            >
              <ChevronLeft size={21} />
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Next product image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
            >
              <ChevronRight size={21} />
            </button>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="View product image full screen"
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white"
            >
              <Maximize2 size={17} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => {
            const active = index === selectedIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View ${productName} image ${index + 1}`}
                aria-pressed={active}
                className={`relative aspect-square overflow-hidden rounded-xl bg-[#f7f8f6] transition ${
                  active
                    ? "border-2 border-[#00765c] ring-2 ring-[#00765c]/15"
                    : "border border-gray-100 hover:border-[#00765c]/50"
                }`}
              >
                <Image
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-contain p-2"
                />
              </button>
            );
          })}
        </div>
      )}

      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image viewer`}
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative flex h-[90vh] w-full max-w-5xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={`${productName} enlarged view`}
              fill
              sizes="100vw"
              className="object-contain p-8"
            />

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close image viewer"
              className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg"
            >
              <X size={22} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous enlarged product image"
                  className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next enlarged product image"
                  className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
