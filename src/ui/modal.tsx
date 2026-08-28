"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

/** Modal accesible: foco atrapado, cierre con Esc, scroll bloqueado (Radix). */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-carbon-950/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[70] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-linen-200 bg-bone-pure p-6 shadow-overlay",
            "data-[state=open]:animate-[reveal-up_280ms_cubic-bezier(0.16,1,0.3,1)]",
            size === "sm" && "max-w-md",
            size === "md" && "max-w-lg",
            size === "lg" && "max-w-2xl",
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-6">
            <div>
              <Dialog.Title className="font-display text-display-sm font-light text-carbon-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-stone-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Cerrar"
                className="-mr-1 -mt-1 rounded-sm p-1.5 text-stone-500 transition-colors hover:bg-linen-200 hover:text-carbon-900"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
          {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} size="sm"
      footer={
        <>
          <Button variant="subtle" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "dark"}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

/** Drawer lateral (desktop) / bottom sheet (mobile). */
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  side = "right",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "bottom";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-carbon-950/60 backdrop-blur-sm data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <Dialog.Content
          className={cn(
            "fixed z-[60] flex flex-col bg-bone-pure shadow-overlay",
            side === "right"
              ? "inset-y-0 right-0 w-full max-w-[440px] sm:rounded-l-lg"
              : "inset-x-0 bottom-0 max-h-[92vh] rounded-t-lg",
          )}
        >
          <div className="flex items-center justify-between border-b border-linen-200 px-5 py-4">
            <Dialog.Title className="eyebrow text-carbon-900">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Cerrar"
                className="rounded-sm p-1.5 text-stone-500 transition-colors hover:bg-linen-200 hover:text-carbon-900"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="border-t border-linen-200 p-5">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
