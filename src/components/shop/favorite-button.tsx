"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorites";
import { cn } from "@/lib/cn";
import { toast } from "@/ui/toaster";

export function FavoriteButton({
  productId,
  productName,
  initialFavorite = false,
  className,
  tone = "light",
}: {
  productId: string;
  productName: string;
  initialFavorite?: boolean;
  className?: string;
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          const result = await toggleFavorite(productId);
          if (result.ok) {
            setIsFavorite(result.isFavorite);
          } else if (result.needsAuth) {
            toast.error(result.error, {
              action: { label: "Ingresar", onClick: () => router.push("/ingresar") },
            });
          } else {
            toast.error(result.error);
          }
        });
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full transition-colors",
        tone === "light"
          ? "bg-bone-pure/85 text-carbon-800 hover:bg-bone-pure"
          : "bg-carbon-900/60 text-linen-200 hover:bg-carbon-900",
        className,
      )}
    >
      <Heart className={cn("size-4", isFavorite && "fill-wine-700 text-wine-700")} />
    </button>
  );
}
