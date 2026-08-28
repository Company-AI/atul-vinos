import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { AddressManager } from "@/components/account/address-manager";
import { EmptyState } from "@/ui/empty-state";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Mis direcciones",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await requireUser("/mi-cuenta/direcciones");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3 mb-8">Mis direcciones</Heading>

      {addresses.length === 0 ? (
        <>
          <EmptyState
            compact
            icon={<MapPin className="size-7" />}
            title="Todavía no guardaste direcciones"
            description="Guardá una dirección para no tener que escribirla en cada compra."
          />
          <div className="mt-6">
            <AddressManager
              addresses={[]}
              defaults={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone }}
            />
          </div>
        </>
      ) : (
        <AddressManager
          addresses={addresses}
          defaults={{ firstName: user.firstName, lastName: user.lastName, phone: user.phone }}
        />
      )}
    </>
  );
}
