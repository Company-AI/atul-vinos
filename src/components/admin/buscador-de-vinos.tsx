"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { coincideBusqueda } from "@/lib/buscar";

/**
 * Buscador de vinos para armar un box.
 *
 * Reemplaza a un desplegable con los veintidós vinos del catálogo, donde
 * encontrar uno era recorrer la lista con la vista. Acá se escribe parte del
 * nombre o del SKU y queda lo que coincide.
 *
 * La búsqueda ignora tildes: "carmenere" encuentra "Carménère". Quien carga
 * productos escribe rápido y no va a poner los acentos.
 *
 * Es un combobox hecho a mano, así que se ocupa de lo que el desplegable del
 * sistema daba gratis: flechas para moverse, Enter para elegir, Escape para
 * cerrar, y el anuncio para lectores de pantalla mediante aria-activedescendant
 * —el foco nunca se va del campo de texto, se mueve la opción marcada—.
 */

export type VinoOpcion = {
  id: string;
  name: string;
  sku: string;
  available: number;
};

export function BuscadorDeVinos({
  vinos,
  valor,
  onElegir,
  /** Vinos que ya están en el box: no se vuelven a ofrecer. */
  excluidos = [],
  id: idExterno,
}: {
  vinos: VinoOpcion[];
  valor: string;
  onElegir: (id: string) => void;
  excluidos?: string[];
  id?: string;
}) {
  const idAuto = useId();
  const id = idExterno ?? idAuto;
  const idLista = `${id}-lista`;

  const elegido = vinos.find((v) => v.id === valor) ?? null;

  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [marcada, setMarcada] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const opciones = useMemo(() => {
    /* El vino ya elegido en esta fila sigue en la lista: si no, no se podría volver a él. */
    const disponibles = vinos.filter((v) => v.id === valor || !excluidos.includes(v.id));
    return disponibles.filter((v) => coincideBusqueda(consulta, v.name, v.sku));
  }, [vinos, excluidos, valor, consulta]);

  // Al cambiar el filtro, la marca vuelve arriba: si no, apunta a una fila que ya no está.
  useEffect(() => setMarcada(0), [consulta]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) cerrar();
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  });

  // La opción marcada tiene que verse aunque se llegue a ella con el teclado.
  useEffect(() => {
    if (!abierto) return;
    listaRef.current
      ?.querySelector(`[data-indice="${marcada}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [marcada, abierto]);

  const cerrar = () => {
    setAbierto(false);
    setConsulta("");
  };

  const elegir = (vino: VinoOpcion) => {
    onElegir(vino.id);
    cerrar();
    campo.current?.blur();
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!abierto) {
        setAbierto(true);
        return;
      }
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setMarcada((m) => {
        if (opciones.length === 0) return 0;
        return (m + paso + opciones.length) % opciones.length;
      });
      return;
    }
    if (e.key === "Enter") {
      if (!abierto) return;
      e.preventDefault();
      const opcion = opciones[marcada];
      if (opcion) elegir(opcion);
      return;
    }
    if (e.key === "Escape") {
      if (!abierto) return;
      e.preventDefault();
      cerrar();
      return;
    }
    if (e.key === "Tab") cerrar();
  };

  return (
    <div ref={contenedor} className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        ref={campo}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={abierto && opciones[marcada] ? `${id}-op-${marcada}` : undefined}
        aria-label="Vino del box"
        /*
          Cerrado muestra el vino elegido; abierto muestra lo que se está
          escribiendo. Son dos cosas distintas y por eso no comparten estado:
          si se mezclaran, abrir el buscador borraría la elección anterior
          antes de haber elegido otra.
        */
        value={abierto ? consulta : (elegido?.name ?? "")}
        placeholder={elegido ? elegido.name : "Buscá por nombre o SKU"}
        onFocus={() => setAbierto(true)}
        onChange={(e) => {
          setConsulta(e.target.value);
          setAbierto(true);
        }}
        onKeyDown={alTeclear}
        className={cn(
          "h-11 w-full rounded-sm border border-linen-300 bg-bone-pure pl-9 pr-9 text-sm text-carbon-900",
          "placeholder:text-stone-400 transition-colors duration-[160ms] focus:border-carbon-900",
        )}
      />
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-500 transition-transform",
          abierto && "rotate-180",
        )}
        aria-hidden
      />

      {abierto && (
        <ul
          ref={listaRef}
          id={idLista}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-y-auto rounded-sm border border-linen-300 bg-bone-pure py-1 shadow-raised"
        >
          {opciones.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-stone-500">
              Ningún vino coincide con «{consulta}».
            </li>
          )}

          {opciones.map((vino, i) => {
            const activa = i === marcada;
            const puesto = vino.id === valor;
            return (
              <li
                key={vino.id}
                id={`${id}-op-${i}`}
                data-indice={i}
                role="option"
                aria-selected={puesto}
                /* mousedown y no click: el click llega después del blur, que ya cerró la lista. */
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(vino);
                }}
                onMouseEnter={() => setMarcada(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px]",
                  activa ? "bg-linen-200 text-carbon-900" : "text-carbon-800",
                )}
              >
                <Check
                  className={cn("size-3.5 shrink-0", puesto ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{vino.name}</span>
                <span className="shrink-0 text-[12px] text-stone-500">{vino.sku}</span>
                <span
                  className={cn(
                    "shrink-0 tabular text-[12px]",
                    vino.available === 0 ? "text-danger-500" : "text-stone-500",
                  )}
                >
                  {vino.available}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
