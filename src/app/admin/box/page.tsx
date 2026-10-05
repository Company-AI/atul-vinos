import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getAvailabilityMap } from "@/domain/inventory/availability";
import { formatARS, toNumber } from "@/lib/money";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "Box" };

/**
 * Los box armados, aparte de los vinos.
 *
 * Un box es un producto como cualquier otro —se vende, tiene precio, fotos y
 * su página en la tienda—, pero se carga de otra manera: lo que importa es qué
 * vinos lleva, no la ficha enológica. Tenerlo en su propia sección evita el
 * paso raro de entrar a "Nuevo producto" y acordarse de cambiar un selector.
 *
 * Lo que no tiene es stock propio: la columna "Se pueden armar" sale del vino
 * más escaso de los que lo componen. Por eso se muestra cuál es el que limita:
 * es la información que hace falta para saber qué reponer.
 */
export default async function AdminBoxPage() {
  const user = await requireStaff("products.view");

  const boxes = await prisma.product.findMany({
    where: { kind: "PACK" },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      packItems: {
        include: { component: { select: { id: true, name: true, price: true } } },
      },
    },
  });

  const availability = await getAvailabilityMap(boxes.map((b) => b.id));
  const puedeEditar = user.isSuperAdmin || user.permissions.has("products.edit");
  const vePrecios =
    user.isSuperAdmin || user.permissions.has("products.price") || user.permissions.has("products.edit");

  return (
    <>
      <AdminPageHeader
        title="Box"
        description={`${boxes.length} box armados con vinos del catálogo`}
        actions={
          puedeEditar ? (
            <Link href="/admin/box/nuevo" className={buttonVariants({ variant: "dark", size: "sm" })}>
              <Plus className="size-3.5" />
              Nuevo box
            </Link>
          ) : null
        }
      />

      {boxes.length === 0 ? (
        <EmptyState
          title="Todavía no hay box armados"
          description="Un box es una selección de vinos que ya tenés cargados, con su propio precio y su propia foto. No necesita stock: se puede armar mientras haya botellas de cada vino."
        />
      ) : (
        <AdminCard padded={false}>
          <AdminTable
            headers={[
              "",
              "Box",
              "Lleva",
              ...(vePrecios
                ? [
                    { label: "Precio", align: "right" as const },
                    { label: "Sueltos valen", align: "right" as const },
                  ]
                : []),
              { label: "Se pueden armar", align: "right" as const },
              "Estado",
            ]}
          >
            {boxes.map((box) => {
              const disponibilidad = availability.get(box.id);
              const botellas = box.packItems.reduce((acc, i) => acc + i.quantity, 0);
              const sueltos = box.packItems.reduce(
                (acc, i) => acc + toNumber(i.component.price) * i.quantity,
                0,
              );
              const precio = toNumber(box.price);
              const ahorro = sueltos > precio ? sueltos - precio : 0;

              return (
                <tr key={box.id}>
                  <Td className="w-10">
                    {box.images[0] && (
                      <Image
                        src={box.images[0].url}
                        alt=""
                        width={28}
                        height={37}
                        className="h-9 w-7 bg-linen-100 object-contain"
                      />
                    )}
                  </Td>
                  <Td>
                    <Link href={`/admin/box/${box.id}`} className="hover:text-accent-700">
                      {box.name}
                    </Link>
                    <span className="block text-[12px] text-stone-500">{box.sku}</span>
                  </Td>
                  <Td>
                    <span className="text-carbon-800">
                      {botellas} {botellas === 1 ? "botella" : "botellas"}
                    </span>
                    <span className="block max-w-[32ch] truncate text-[12px] text-stone-500">
                      {box.packItems.map((i) => i.component.name).join(" · ") || "sin vinos"}
                    </span>
                  </Td>
                  {vePrecios && (
                    <>
                      <Td align="right" className="whitespace-nowrap tabular">
                        {formatARS(precio)}
                      </Td>
                      <Td align="right" className="whitespace-nowrap tabular text-stone-500">
                        {formatARS(sueltos)}
                        {ahorro > 0 && (
                          <span className="block text-[12px] text-success-500">
                            −{formatARS(ahorro)}
                          </span>
                        )}
                      </Td>
                    </>
                  )}
                  <Td align="right" className="tabular">
                    {disponibilidad?.available ?? 0}
                    {disponibilidad?.limitedBy && (
                      <span className="block max-w-[24ch] truncate text-[12px] font-sans text-stone-500">
                        limita {disponibilidad.limitedBy.name}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        box.status === "ACTIVE"
                          ? "success"
                          : box.status === "DRAFT"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {box.status === "ACTIVE"
                        ? "Publicado"
                        : box.status === "DRAFT"
                          ? "Borrador"
                          : "Archivado"}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </AdminTable>
        </AdminCard>
      )}
    </>
  );
}
