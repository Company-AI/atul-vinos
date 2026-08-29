"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";

export async function saveCustomerNote(input: {
  userId: string;
  note: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  let user;
  try {
    user = await assertPermission("customers.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const before = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { internalNotes: true },
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: { internalNotes: input.note.trim() || null },
  });

  await recordAudit(user, {
    action: "customer.note",
    entityType: "User",
    entityId: input.userId,
    before: { internalNotes: before?.internalNotes },
    after: { internalNotes: input.note },
  });

  revalidatePath(`/admin/clientes/${input.userId}`);
  return { ok: true, message: "Nota guardada." };
}
