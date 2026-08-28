import { getActivePlans } from "@/domain/subscriptions/plans";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";
import { Reveal } from "@/ui/reveal";
import { EmptyState } from "@/ui/empty-state";
import { ClubPlanCard } from "./club-plan-card";

export async function ClubPlansSection({
  currentPlanId,
  eyebrow = "Planes",
  title = "Elegí cuánto vino querés descubrir.",
  body = "Todos los planes se cobran automáticamente cada mes y podés pausarlos, cambiarlos o cancelarlos cuando quieras.",
}: {
  currentPlanId?: string | null;
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  const plans = await getActivePlans();

  return (
    <section id="planes" className="on-dark bg-carbon-950 py-section text-linen-100">
      <Container>
        <Reveal className="mb-14 max-w-2xl">
          <Eyebrow className="text-gold-400">{eyebrow}</Eyebrow>
          <Heading size="lg" className="mt-5 text-bone">{title}</Heading>
          <Prose className="mt-5 text-stone-400">{body}</Prose>
        </Reveal>

        {plans.length === 0 ? (
          <EmptyState
            title="Todavía no hay planes disponibles"
            description="Estamos armando las opciones del Club. Dejanos tu email en el footer y te avisamos."
            className="border-carbon-700"
          />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <li key={plan.id}>
                <Reveal delay={i * 0.08} className="h-full">
                  <ClubPlanCard plan={plan} currentPlanId={currentPlanId} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 max-w-2xl text-[13px] leading-relaxed text-stone-500">
          El cobro se realiza el mismo día de cada mes en que te suscribiste. Preparamos y
          despachamos las cajas entre el 22 y el 28. Sin contratos ni permanencia mínima.
        </p>
      </Container>
    </section>
  );
}
