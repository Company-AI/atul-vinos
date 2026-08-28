"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { ORDER_STATUS_ADMIN_LABELS } from "@/domain/orders/status";
import { Button } from "@/ui/button";
import { Input, Select } from "@/ui/field";

export function OrderFilters({
  carriers,
}: {
  carriers: { code: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("pagina");
    startTransition(() => router.push(`?${next.toString()}`));
  };

  const activeCount = [...params.keys()].filter((k) => k !== "pagina").length;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Buscar</span>
        <Input
          defaultValue={params.get("q") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
          }}
          placeholder="Nº, cliente, email, tracking"
          className="h-8 w-52 text-[13px]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Estado</span>
        <Select
          value={params.get("estado") ?? ""}
          onChange={(e) => set("estado", e.target.value)}
          className="h-8 w-auto text-[13px]"
        >
          <option value="">Todos</option>
          {Object.entries(ORDER_STATUS_ADMIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Tipo</span>
        <Select
          value={params.get("tipo") ?? ""}
          onChange={(e) => set("tipo", e.target.value)}
          className="h-8 w-auto text-[13px]"
        >
          <option value="">Todos</option>
          <option value="STORE">Tienda</option>
          <option value="SUBSCRIPTION">Club</option>
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Transportista</span>
        <Select
          value={params.get("transportista") ?? ""}
          onChange={(e) => set("transportista", e.target.value)}
          className="h-8 w-auto text-[13px]"
        >
          <option value="">Todos</option>
          {carriers.map((carrier) => (
            <option key={carrier.code} value={carrier.code}>{carrier.name}</option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Desde</span>
        <Input
          type="date"
          value={params.get("desde") ?? ""}
          onChange={(e) => set("desde", e.target.value)}
          className="h-8 w-auto text-[13px]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Hasta</span>
        <Input
          type="date"
          value={params.get("hasta") ?? ""}
          onChange={(e) => set("hasta", e.target.value)}
          className="h-8 w-auto text-[13px]"
        />
      </label>

      {activeCount > 0 && (
        <Button
          size="sm"
          variant="quiet"
          disabled={pending}
          onClick={() => startTransition(() => router.push("?"))}
        >
          <X className="size-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
