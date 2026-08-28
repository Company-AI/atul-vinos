"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { LabelData } from "@/infra/labels/render";
import { Button } from "@/ui/button";

type Format = "A4" | "THERMAL_100X150";

/**
 * Hoja de etiquetas imprimible. Dos formatos:
 *  - A4: cuatro etiquetas por hoja
 *  - Térmica 100×150 mm: una etiqueta por página
 */
export function LabelSheet({
  labels,
  defaultFormat,
}: {
  labels: LabelData[];
  defaultFormat: Format;
}) {
  const [format, setFormat] = useState<Format>(defaultFormat);

  useEffect(() => {
    document.documentElement.dataset.labelFormat = format;
  }, [format]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex rounded-sm border border-linen-300 bg-bone-pure p-0.5">
          {(["THERMAL_100X150", "A4"] as Format[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFormat(option)}
              className={`rounded-xs px-3 py-1.5 text-[12px] transition-colors ${
                format === option ? "bg-carbon-900 text-bone" : "text-carbon-800 hover:bg-linen-100"
              }`}
            >
              {option === "A4" ? "A4 (4 por hoja)" : "Térmica 100×150"}
            </button>
          ))}
        </div>

        <Button size="sm" variant="dark" onClick={() => window.print()}>
          <Printer className="size-3.5" />
          Imprimir {labels.length} {labels.length === 1 ? "etiqueta" : "etiquetas"}
        </Button>

        <p className="text-[12px] text-stone-500">
          Verificá en el diálogo de impresión que los márgenes estén en «ninguno» y la escala al 100%.
        </p>
      </div>

      <style>{`
        @page { margin: 0; }
        html[data-label-format="THERMAL_100X150"] .label { width: 100mm; height: 150mm; }
        html[data-label-format="A4"] .label { width: 105mm; height: 148mm; }
        @media print {
          html[data-label-format="THERMAL_100X150"] { }
          html[data-label-format="THERMAL_100X150"] .label { page-break-after: always; }
          html[data-label-format="A4"] .sheet { display: flex; flex-wrap: wrap; width: 210mm; }
          html[data-label-format="A4"] .label:nth-child(4n) { page-break-after: always; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="sheet flex flex-wrap gap-2 print:gap-0">
        {labels.map((label) => (
          <article
            key={label.shipmentId}
            className="label flex flex-col justify-between border border-carbon-900 bg-white p-3 text-carbon-950"
          >
            {/* Remitente y transportista */}
            <header className="flex items-start justify-between gap-2 border-b border-carbon-900 pb-2">
              <div className="text-[8px] leading-tight">
                <p className="font-bold uppercase">{label.sender.name}</p>
                <p>{label.sender.addressLine}</p>
                <p>{label.sender.city}, {label.sender.province} ({label.sender.postalCode})</p>
                <p>{label.sender.phone}</p>
              </div>
              <div className="text-right text-[8px] leading-tight">
                <p className="font-bold uppercase">{label.carrierName}</p>
                <p>Pedido #{label.orderNumber}</p>
                <p>{label.orderType === "SUBSCRIPTION" ? "CLUB" : "TIENDA"}</p>
              </div>
            </header>

            {/* Destinatario */}
            <div className="flex-1 py-2">
              <p className="text-[7px] uppercase tracking-wider">Destinatario</p>
              <p className="mt-0.5 text-[13px] font-bold uppercase leading-tight">
                {label.recipient.name}
              </p>
              <p className="mt-1 text-[11px] leading-snug">
                {label.recipient.street} {label.recipient.number}
                {label.recipient.apartment ? `, ${label.recipient.apartment}` : ""}
              </p>
              <p className="text-[11px] leading-snug">
                {label.recipient.city}, {label.recipient.province}
              </p>
              <p className="mt-0.5 text-[15px] font-bold leading-none">
                CP {label.recipient.postalCode}
              </p>
              {label.recipient.phone && (
                <p className="mt-1 text-[10px]">Tel. {label.recipient.phone}</p>
              )}
              {label.recipient.documentId && (
                <p className="text-[10px]">DNI {label.recipient.documentId}</p>
              )}
              {label.recipient.reference && (
                <p className="mt-1 text-[9px] italic leading-snug">{label.recipient.reference}</p>
              )}
            </div>

            {/* Contenido y QR */}
            <div className="flex items-end justify-between gap-2 border-t border-carbon-900 pt-2">
              <div className="text-[9px] leading-tight">
                <p>
                  {label.bottles} {label.bottles === 1 ? "botella" : "botellas"} ·{" "}
                  {(label.weightGrams / 1000).toFixed(1)} kg
                </p>
                <p className="mt-0.5 font-bold uppercase">Frágil — vidrio</p>
                <p className="text-[8px]">No apilar. Mantener en posición horizontal.</p>
              </div>
              <div
                className="size-16 shrink-0 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: label.qrSvg }}
              />
            </div>

            {/* Código de barras */}
            <footer className="mt-2 border-t border-carbon-900 pt-1.5 text-center">
              {label.barcodeSvg ? (
                <div
                  className="mx-auto h-8 [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: label.barcodeSvg }}
                />
              ) : null}
              <p className="mt-0.5 text-[11px] font-bold tracking-widest">{label.trackingNumber}</p>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
