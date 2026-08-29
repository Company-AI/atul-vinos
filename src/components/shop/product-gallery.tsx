"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type GalleryImage = { id: string; url: string; alt: string | null };

/** Galería de producto: imagen grande + miniaturas navegables por teclado. */
export function ProductGallery({
  images,
  productName,
  videoUrl,
}: {
  images: GalleryImage[];
  productName: string;
  videoUrl?: string | null;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center bg-linen-100 text-stone-400">
        Sin imagen
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bone-pure">
        {videoUrl && active === -1 ? (
          <video
            src={videoUrl}
            controls
            playsInline
            className="size-full object-cover"
            aria-label={`Video de ${productName}`}
          />
        ) : (
          <Image
            src={current.url}
            alt={current.alt ?? productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-10"
          />
        )}
      </div>

      {(images.length > 1 || videoUrl) && (
        <ul className="flex gap-3" role="tablist" aria-label={`Imágenes de ${productName}`}>
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Ver imagen ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  "relative size-20 overflow-hidden border bg-linen-100 transition-colors",
                  i === active ? "border-carbon-900" : "border-linen-300 hover:border-stone-400",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                />
              </button>
            </li>
          ))}
          {videoUrl && (
            <li>
              <button
                type="button"
                role="tab"
                aria-selected={active === -1}
                onClick={() => setActive(-1)}
                className={cn(
                  "grid size-20 place-items-center border text-[11px] uppercase tracking-wider transition-colors",
                  active === -1 ? "border-carbon-900" : "border-linen-300 hover:border-stone-400",
                )}
              >
                Video
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
