import Image from "next/image";

/**
 * Logotipo real de Atul.
 *
 * El prototipo lo dibujaba con CSS —la palabra en Cormorant espaciada y la
 * "U" convertida en copa con un borde redondeado— porque no tenía el archivo.
 * Acá va el PNG real.
 *
 * Se mantiene la altura del logotipo dibujado (45px: 29 de la palabra, 7 de
 * separación y 9 del "VINOS") para no mover el ritmo de la cabecera de 76px
 * ni el alto del pie.
 *
 * Sobre crema va la versión azul; sobre el azul del pie, la crema.
 */
export function MarcaAtul({ tono = "azul" }: { tono?: "azul" | "crema" }) {
  return (
    <Image
      src={tono === "crema" ? "/brand/logotipo-crema.png" : "/brand/logotipo-azul.png"}
      alt="Atul Vinos"
      width={683}
      height={227}
      priority
      style={{ height: 45, width: "auto" }}
    />
  );
}
