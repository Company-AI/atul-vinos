"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] error no controlado:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <AlertTriangle className="mx-auto size-8 text-danger-500" />
        <h1 className="mt-5 font-display text-[24px] font-light text-carbon-900">
          No pudimos cargar esta sección
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-stone-600">
          {error.message || "Ocurrió un error inesperado."}
        </p>
        {error.digest && (
          <p className="mt-2 text-[12px] tabular text-stone-400">Referencia: {error.digest}</p>
        )}
        <Button variant="dark" className="mt-6" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
