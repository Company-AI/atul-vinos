"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/field";

export function ReportRangeForm({ desde, hasta }: { desde?: string; hasta?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`?${next.toString()}`));
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Desde</span>
        <Input
          type="date"
          defaultValue={desde ?? ""}
          onChange={(e) => set("desde", e.target.value)}
          className="h-8 w-auto text-[13px]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-stone-500">Hasta</span>
        <Input
          type="date"
          defaultValue={hasta ?? ""}
          onChange={(e) => set("hasta", e.target.value)}
          className="h-8 w-auto text-[13px]"
        />
      </label>
      {(desde || hasta) && (
        <Button size="sm" variant="quiet" disabled={pending} onClick={() => router.push("?")}>
          Limpiar rango
        </Button>
      )}
    </div>
  );
}
