"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { Button } from "@/ui/button";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await subscribeToNewsletter({ email, source });
          setStatus(
            result.ok
              ? { ok: true, message: result.message }
              : { ok: false, message: result.error },
          );
          if (result.ok) setEmail("");
        });
      }}
      className="max-w-sm"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Tu email
      </label>
      <div className="flex items-center gap-2 border-b border-carbon-600 pb-2 focus-within:border-linen-200">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          aria-describedby="newsletter-status"
          className="w-full bg-transparent text-sm text-bone outline-none placeholder:text-stone-500"
        />
        <Button
          type="submit"
          variant="quiet"
          size="icon"
          loading={pending}
          disabled={pending}
          aria-label="Suscribirme"
          className="text-linen-200 hover:bg-carbon-700 hover:text-bone"
        >
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </div>
      <p
        id="newsletter-status"
        aria-live="polite"
        className={`mt-2 min-h-4 text-[12px] ${
          status ? (status.ok ? "text-success-500" : "text-danger-500") : "text-stone-500"
        }`}
      >
        {status?.message ?? ""}
      </p>
    </form>
  );
}
