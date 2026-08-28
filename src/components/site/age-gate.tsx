import { cookies } from "next/headers";
import type { Settings } from "@/domain/settings/schema";
import { AgeGateOverlay } from "./age-gate-overlay";

export const AGE_GATE_COOKIE = "bodega_age_ok";

/**
 * Se renderiza en el servidor: si la cookie ya existe, no se envía nada al
 * cliente. El contenido de la página siempre está en el DOM, así que el gate
 * no afecta la indexación.
 */
export async function AgeGate({
  settings,
  legal,
  company,
}: {
  settings: Settings["ageGate"];
  legal: Settings["legal"];
  company: Settings["company"];
}) {
  if (!settings.enabled) return null;

  const store = await cookies();
  if (store.get(AGE_GATE_COOKIE)?.value === "1") return null;

  return (
    <AgeGateOverlay
      title={settings.title}
      message={settings.message.replace("18", String(settings.minAge))}
      confirmLabel={settings.confirmLabel.replace("18", String(settings.minAge))}
      exitLabel={settings.exitLabel}
      legalNote={settings.legalNote || legal.minorsNotice}
      backgroundUrl={settings.backgroundUrl}
      imageUrl={settings.imageUrl}
      exitUrl={settings.exitUrl}
      rememberDays={settings.rememberDays}
      companyName={company.name}
      logoUrl={company.logoLightUrl}
    />
  );
}
