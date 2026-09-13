/**
 * Logotipo tal como lo resuelve el prototipo: dibujado con CSS, con la "U"
 * convertida en copa por un borde inferior redondeado.
 *
 * El proyecto tiene los PNG reales del logo en /media/brand/, pero el pedido
 * fue clonar la UI como está en el prototipo, y ahí el logotipo es tipográfico.
 * Cambiarlo por la imagen real es reemplazar este componente por un <Image>.
 */
export function MarcaAtul() {
  return (
    <>
      <span className="brand-word">
        AT<span className="brand-cup">U</span>L
      </span>
      <span className="brand-sub">VINOS</span>
    </>
  );
}
