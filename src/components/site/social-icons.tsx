/** Glifos de redes en SVG inline (lucide ya no incluye iconos de marca). */

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">
      {/* Globo de chat con la cola abajo a la izquierda, como el de la app. */}
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20.5l1.6-5.3A8.5 8.5 0 1 1 21 11.5Z" />
      {/* El auricular, simplificado: a 18 px el detalle fino se pierde igual. */}
      <path d="M9 9.2c0 2.6 2.1 4.8 4.8 4.8l.9-1.4-1.9-1-.8.8a4.4 4.4 0 0 1-1.4-1.4l.8-.8-1-1.9-1.4.9Z"
        fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">
      <path d="M14.5 8.5h2.2V5.6h-2.4c-2.2 0-3.6 1.4-3.6 3.7v1.9H8.4v3h2.3V21h3.1v-6.8h2.3l.4-3h-2.7V9.6c0-.7.3-1.1 1-1.1Z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
