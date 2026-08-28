"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CATALOG_SORTS } from "@/domain/catalog/types";
import { PARAM_KEYS } from "@/domain/catalog/params";
import { Select } from "@/ui/field";

export function CatalogSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get(PARAM_KEYS.orden) ?? "destacados";

  return (
    <label className="flex items-center gap-2 text-[13px] text-stone-500">
      <span className="hidden sm:inline">Ordenar por</span>
      <Select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set(PARAM_KEYS.orden, e.target.value);
          params.delete(PARAM_KEYS.page);
          startTransition(() => router.push(`?${params.toString()}`, { scroll: false }));
        }}
        className="h-9 w-auto min-w-[170px] text-[13px]"
        aria-label="Ordenar resultados"
      >
        {Object.entries(CATALOG_SORTS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>
    </label>
  );
}
