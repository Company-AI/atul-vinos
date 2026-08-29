"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] error no controlado:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bone px-6 text-center">
      <p className="eyebrow text-stone-500">Algo salió mal</p>
      <h1 className="mt-5 max-w-[20ch] font-display text-display-lg font-light text-carbon-900">
        Tuvimos un problema al cargar esta página.
      </h1>
      <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-stone-600">
        Ya quedó registrado de nuestro lado. Podés reintentar; si vuelve a pasar, escribinos y lo
        resolvemos.
      </p>
      {error.digest && (
        <p className="mt-3 text-[12px] tabular text-stone-400">Referencia: {error.digest}</p>
      )}
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button variant="dark" uppercase onClick={reset}>
          Reintentar
        </Button>
        <Link href="/contacto" className={buttonVariants({ variant: "outline", uppercase: true })}>
          Escribirnos
        </Link>
      </div>
    </div>
  );
}
