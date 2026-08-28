import { cache } from "react";
import { prisma } from "@/infra/db/prisma";
import {
  GROUP_SCHEMAS,
  defaultSettings,
  settingsSchema,
  type Settings,
  type SettingsGroup,
} from "./schema";

/**
 * Lee la configuración mergeando defaults + base de datos.
 * `cache()` la resuelve una sola vez por request.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const raw: Record<string, unknown> = {};
  for (const row of rows) raw[row.key] = row.value;
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : defaultSettings();
});

export async function getSettingGroup<G extends SettingsGroup>(
  group: G,
): Promise<Settings[G]> {
  const settings = await getSettings();
  return settings[group];
}

/** Guarda un grupo validado. Devuelve el grupo persistido. */
export async function saveSettingGroup<G extends SettingsGroup>(
  group: G,
  value: unknown,
  updatedBy?: string,
): Promise<Settings[G]> {
  const schema = GROUP_SCHEMAS[group];
  const parsed = schema.parse(value) as Settings[G];
  await prisma.setting.upsert({
    where: { key: group },
    create: { key: group, group, value: parsed as object, updatedBy },
    update: { value: parsed as object, updatedBy },
  });
  return parsed;
}
