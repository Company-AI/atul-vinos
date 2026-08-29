"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import {
  GROUP_SCHEMAS, saveSettingGroup, type SettingsGroup,
} from "@/domain/settings";

export type SettingsActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function updateSettings(input: {
  group: SettingsGroup;
  values: Record<string, unknown>;
}): Promise<SettingsActionResult> {
  let user;
  try {
    user = await assertPermission("settings.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  if (!GROUP_SCHEMAS[input.group]) {
    return { ok: false, error: "Grupo de configuración desconocido." };
  }

  const before = await prisma.setting.findUnique({ where: { key: input.group } });

  try {
    await saveSettingGroup(input.group, input.values, user.email);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Valores inválidos.";
    return { ok: false, error: message.slice(0, 300) };
  }

  await recordAudit(user, {
    action: "settings.update",
    entityType: "Setting",
    entityId: input.group,
    before: before?.value,
    after: input.values,
  });

  // La configuración afecta a todo el sitio.
  revalidatePath("/", "layout");
  return { ok: true, message: "Configuración guardada." };
}
