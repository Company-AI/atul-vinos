import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart } from "@/domain/cart/service";
import { getSettings } from "@/domain/settings/service";
import { getCurrentUser } from "@/infra/auth/session";
import { prisma } from "@/infra/db/prisma";
import { getPaymentProvider } from "@/infra/payments/registry";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { Container, Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/carrito");

  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  const defaultAddress = user
    ? await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
      })
    : null;

  const provider = getPaymentProvider();

  return (
    <Container className="py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Último paso</Eyebrow>
          <Heading level={1} size="md" className="mt-3">
            Finalizá tu compra
          </Heading>
        </div>
        {!user && (
          <p className="text-[13px] text-stone-500">
            ¿Ya tenés cuenta?{" "}
            <Link href="/ingresar?next=/checkout" className="underline underline-offset-4 hover:text-carbon-900">
              Ingresá
            </Link>{" "}
            para usar tus datos guardados.
          </p>
        )}
      </div>

      <CheckoutForm
        cart={cart}
        requireDocument={settings.company.requireDocumentAtCheckout}
        providerLabel={provider.name}
        prefill={{
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          phone: user?.phone ?? undefined,
          address: defaultAddress
            ? {
                street: defaultAddress.street,
                number: defaultAddress.number,
                apartment: defaultAddress.apartment ?? "",
                city: defaultAddress.city,
                province: defaultAddress.province,
                postalCode: defaultAddress.postalCode,
                reference: defaultAddress.reference ?? "",
              }
            : undefined,
        }}
      />
    </Container>
  );
}
