import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve, extname } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

/**
 * Sirve las fotos que se suben desde el panel.
 *
 * Hace falta porque Next, en la compilación autocontenida que corre en el
 * servidor, arma la lista de archivos públicos al construir la imagen: lo que
 * aparece en public/ después existe en el disco pero no para él, y responde
 * 404. Las fotos de los productos se suben con el sitio ya corriendo, así que
 * caían siempre en ese agujero —y con ellas el optimizador de imágenes, que
 * las pide por la misma dirección—.
 *
 * Esto no reemplaza al almacenamiento: los archivos siguen en el disco, en el
 * volumen que sobrevive a los despliegues. Esto sólo los entrega.
 */

const RAIZ = resolve(process.cwd(), "public", "uploads");

const TIPOS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ruta: string[] }> },
) {
  const { ruta } = await params;

  /*
    El camino se arma y después se comprueba que siga adentro de la carpeta de
    subidas. Sin esto, un pedido con ".." se llevaría cualquier archivo del
    servidor: el secreto de las sesiones, las credenciales de la base.
  */
  const destino = resolve(join(RAIZ, ...ruta));
  if (destino !== RAIZ && !destino.startsWith(RAIZ + "/")) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const tipo = TIPOS[extname(destino).toLowerCase()];
  // Sólo imágenes y videos: esta carpeta no sirve para repartir otra cosa.
  if (!tipo) return new NextResponse("No encontrado", { status: 404 });

  let info;
  try {
    info = await stat(destino);
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
  if (!info.isFile()) return new NextResponse("No encontrado", { status: 404 });

  /*
    El nombre de cada archivo lleva un identificador al azar y nunca se
    reemplaza: subir otra foto crea otro archivo. Por eso se puede cachear
    para siempre, y el navegador deja de pedirla en cada visita.
  */
  const stream = Readable.toWeb(createReadStream(destino)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
