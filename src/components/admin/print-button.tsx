"use client";

import { Printer } from "lucide-react";
import { Button } from "@/ui/button";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <Button size="sm" variant="dark" onClick={() => window.print()}>
      <Printer className="size-3.5" />
      {label}
    </Button>
  );
}
