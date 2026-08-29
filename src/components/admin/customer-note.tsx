"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCustomerNote } from "@/app/actions/admin-customers";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";

export function CustomerNote({
  userId,
  initialNote,
}: {
  userId: string;
  initialNote: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Textarea
        value={note}
        maxLength={1000}
        placeholder="Preferencias, acuerdos comerciales, cosas a tener en cuenta…"
        aria-label="Nota interna del cliente"
        onChange={(e) => setNote(e.target.value)}
      />
      <Button
        size="sm"
        variant="dark"
        className="mt-2"
        loading={pending}
        disabled={pending || note === initialNote}
        onClick={() =>
          startTransition(async () => {
            const result = await saveCustomerNote({ userId, note });
            if (result.ok) {
              toast.success(result.message);
              router.refresh();
            } else toast.error(result.error);
          })
        }
      >
        Guardar nota
      </Button>
      <p className="mt-2 text-[11px] text-stone-500">
        Solo la ve el equipo. Queda registrada en la auditoría.
      </p>
    </div>
  );
}
