import { cookies } from "next/headers";
import type { Settings } from "@/domain/settings/schema";
import { AgeGateOverlay } from "./age-gate-overlay";

export { AGE_GATE_COOKIE } from "./age-gate-contrato";
import { AGE_GATE_COOKIE } from "./age-gate-contrato";

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
  /*
    Sólo los dos campos que se usan, no el grupo entero. Recibir
    Settings["company"] completo hacía que el teléfono, el mail, la
    dirección del remitente y los datos fiscales viajaran serializados en
    el HTML de todas las páginas, aunque el gate no los mostrara. Nada de
    eso es secreto, pero tampoco hay por qué publicarlo.
  */
  company: Pick<Settings["company"], "name" | "logoLightUrl">;
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
