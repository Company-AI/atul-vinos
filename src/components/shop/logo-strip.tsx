import Image from "next/image";

/**
 * Tira de bodegas que distribuimos.
 *
 * Va entre dos bloques de varietal para cortar la sucesión de grillas: dos
 * reglas finas, los logos en gris y nada más. Es aire, no una sección.
 *
 * Los logos van en gris y recuperan su color al pasar el mouse. Las marcas
 * tienen paletas que pelean entre sí y con la página; en gris la fila se lee
 * como un conjunto en vez de como un collage.
 */
export type LogoBodega = {
  nombre: string;
  /** PNG con fondo transparente, alto útil ~80px. */
  archivo: string;
};

export function LogoStrip({ bodegas }: { bodegas: LogoBodega[] }) {
  if (bodegas.length === 0) return null;

  return (
    <section className="mt-16 border-y border-linen-200 bg-bone-pure">
      <div className="mx-auto max-w-[1600px] px-gutter py-10">
        <p className="eyebrow text-center text-stone-500">Las bodegas que trabajamos</p>

        {/*
          Riel: con dos docenas de logos no entran en una fila y apilarlos en
          grilla los convierte en un muro. Así se recorren.
        */}
        <ul className="rail-snap mt-8 items-center gap-12 pb-2 sm:gap-16">
          {bodegas.map((b) => (
            <li key={b.nombre} className="shrink-0">
              <Image
                src={b.archivo}
                alt={b.nombre}
                width={200}
                height={80}
                className="h-[54px] w-auto opacity-55 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
