# Poner Cloudflare delante del sitio

El servidor está en Seattle y los clientes en Argentina: 255 ms de ida y
vuelta en cada pedido. Medido contra producción, abrir la conexión y cifrarla
se lleva más de medio segundo **antes** de pedir la primera imagen. Las fotos
pesan entre 60 y 95 KB; no son ellas, es la distancia.

Cloudflare tiene un nodo en Buenos Aires. Las imágenes y los archivos quedan
guardados ahí, a unos 20 ms de quien compra, en vez de cruzar el continente.
El plan gratuito alcanza de sobra.

## Antes de empezar

El sitio sigue funcionando durante todo el proceso. Lo único que se cambia
son los servidores de nombres del dominio, y eso se puede revertir.

Hace falta: la cuenta donde está registrado **atulvinos.com**.

## Los pasos

**1. Crear la cuenta y agregar el dominio.**
En `dash.cloudflare.com`, "Add a site" → `atulvinos.com` → plan **Free**.

Cloudflare lee los registros que ya existen. Revisá que estén los dos que
importan, los dos apuntando a `66.94.118.67`:

| Tipo | Nombre | Contenido | Proxy |
| --- | --- | --- | --- |
| A | `atulvinos.com` | 66.94.118.67 | **Naranja (activado)** |
| A | `www` | 66.94.118.67 | **Naranja (activado)** |

La nube naranja es lo que hace todo el trabajo. Si queda gris, Cloudflare
sólo resuelve el nombre y no guarda nada.

**2. Cambiar los servidores de nombres.**
Cloudflare te da dos, con forma de `algo.ns.cloudflare.com`. Hay que ponerlos
en el panel donde compraste el dominio, reemplazando los que estén.

Tarda entre unos minutos y unas horas en propagarse. Mientras tanto el sitio
anda igual.

**3. Poner el cifrado en "Full (strict)".**
SSL/TLS → Overview → **Full (strict)**.

> Esto no es opcional y es el error más común. El servidor ya tiene su
> certificado propio, válido. Si elegís **Flexible**, Cloudflare le habla sin
> cifrar, el servidor lo manda a la versión segura, y el sitio queda dando
> vueltas en un bucle hasta que el navegador se rinde.

**4. Hacer que las fotos de los productos se guarden en el nodo.**

Cloudflare guarda solo lo que tiene cara de archivo —`.jpg`, `.css`, `.js`— y
las fotos de los productos pasan por una dirección que no la tiene. Hay que
decírselo:

Caching → Cache Rules → Create rule

- Nombre: `Fotos de productos`
- Si: **URI Path** *starts with* `/_next/image`
- Entonces: Cache eligibility → **Eligible for cache**
- Edge TTL: **1 mes**

**5. Comprobar que quedó bien.**

```bash
curl -sI https://www.atulvinos.com/media/wines/tinto.jpg | grep -i "cf-cache-status\|server"
```

Tiene que decir `server: cloudflare`. La primera vez `cf-cache-status` dirá
`MISS`; pedila de nuevo y tiene que decir `HIT`. Ahí está funcionando.

## Lo que no hay que hacer

**No actives "Rocket Loader" ni "Auto Minify".** Reordenan el JavaScript de la
página y rompen sitios hechos con React de formas difíciles de diagnosticar.

**No pongas el panel detrás de caché.** `/admin` y `/api` ya salen marcados
como "no guardar"; no agregues reglas que los incluyan. Una respuesta del
panel guardada en el nodo es el pedido de una persona mostrado a otra.

## Si algo sale mal

Volver atrás es cambiar los servidores de nombres a los de antes. Anotalos
**antes** de tocar nada.

Para una prueba rápida sin esperar la propagación, poné la nube en gris: el
tráfico deja de pasar por Cloudflare al instante y va derecho al servidor.
