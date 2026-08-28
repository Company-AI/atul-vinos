"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={4200}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-md !border !border-linen-200 !bg-bone-pure !text-carbon-900 !shadow-raised !font-sans",
          description: "!text-stone-500",
          actionButton: "!bg-carbon-900 !text-bone !rounded-sm",
          cancelButton: "!bg-linen-200 !text-carbon-900 !rounded-sm",
        },
      }}
    />
  );
}

export { toast } from "sonner";
