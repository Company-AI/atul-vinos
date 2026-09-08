"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/ui/button";
import type { BlockData } from "@/domain/cms/blocks";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * Hero cinematográfico con video opcional.
 *
 * Reglas de rendimiento (spec §5):
 *  - poster siempre presente; el video es una mejora, nunca un requisito
 *  - preload="none" y montaje solo cuando el hero entra en viewport
 *  - fuentes separadas desktop / mobile
 *  - no se carga video con reduced-motion, save-data, 2g/3g, o en mobile
 *    cuando no hay fuente mobile
 *  - si el video falla, se muestra la fotografía
 *  - se pausa al salir del viewport para no gastar CPU ni batería
 */
export function VideoHero({
  data,
  logoUrl,
  companyName,
  priority = true,
}: {
  data: BlockData<"video_hero">;
  logoUrl?: string;
  companyName?: string;
  priority?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mountVideo, setMountVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const { media } = data;
  const posterUrl = media.posterUrl || media.imageUrl;
  const hasVideoSource = Boolean(media.videoDesktopUrl || media.videoMobileUrl);

  useEffect(() => {
    if (!hasVideoSource) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && ["slow-2g", "2g", "3g"].includes(connection.effectiveType)) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile && !media.videoMobileUrl) return;

    const element = containerRef.current;
    if (!element) return;

    // Se monta el video recién cuando el hero está a la vista.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMountVideo(true);
            videoRef.current?.play().catch(() => setVideoFailed(true));
          } else {
            videoRef.current?.pause();
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasVideoSource, media.videoMobileUrl]);

  const showVideo = mountVideo && !videoFailed;
  /*
    La foto del hero es una pared beige clara: ahí el titular va oscuro y el
    velo tiene que aclarar, no oscurecer. El overlay clásico asume lo
    contrario, así que el tono decide colores y velo.
  */
  const textoOscuro = data.textTone === "dark";

  const heights = {
    full: "min-h-[88svh] lg:min-h-[100svh]",
    tall: "min-h-[72svh] lg:min-h-[82svh]",
    medium: "min-h-[56svh] lg:min-h-[64svh]",
  } as const;

  /*
    Modo partido: el texto va sobre fondo sólido y la foto al costado. El
    overlay depende de que la imagen sea lo bastante oscura donde cae el
    titular, y con fotos claras el texto se pierde. Acá el contraste está
    garantizado por construcción.
  */
  if (data.layout === "split") {
    return (
      <section ref={containerRef} className="border-b border-linen-200 bg-bone">
        <div className="mx-auto grid max-w-[1440px] items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center px-gutter py-14 lg:py-24">
            {data.eyebrow && (
              <p className="eyebrow text-stone-500 opacity-0 animate-[reveal-up_800ms_cubic-bezier(0.16,1,0.3,1)_120ms_forwards]">
                {data.eyebrow}
              </p>
            )}

            {/*
              La primera línea va en mayúsculas y la segunda en itálica: es el
              contraste que sostiene la identidad de la marca en el hero.
            */}
            <h1
              className={cn(
                "mt-5 max-w-[20ch] font-display text-carbon-900 opacity-0",
                "animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_240ms_forwards]",
                data.scale === "hero" ? "text-display-2xl" : "text-display-xl",
              )}
            >
              <span className="block font-medium uppercase tracking-[0.005em]">{data.title}</span>
              {data.titleAccent && (
                <span className="mt-1 block font-light italic text-carbon-800">
                  {data.titleAccent}
                </span>
              )}
            </h1>

            {data.subtitle && (
              <p className="mt-6 max-w-[46ch] text-lead text-stone-600 opacity-0 animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_380ms_forwards]">
                {data.subtitle}
              </p>
            )}

            {(data.ctaPrimary.label || data.ctaSecondary.label) && (
              <div className="mt-9 flex flex-col items-start gap-3 opacity-0 animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_500ms_forwards] sm:flex-row sm:items-center">
                {data.ctaPrimary.label && (
                  <Link
                    href={data.ctaPrimary.href}
                    className={buttonVariants({ variant: "primary", size: "lg", uppercase: true })}
                  >
                    {data.ctaPrimary.label}
                  </Link>
                )}
                {data.ctaSecondary.label && (
                  <Link
                    href={data.ctaSecondary.href}
                    className={buttonVariants({ variant: "outline", size: "lg", uppercase: true })}
                  >
                    {data.ctaSecondary.label}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="relative min-h-[42svh] lg:min-h-[64svh]">
            {posterUrl && (
              <Image
                src={posterUrl}
                alt={media.imageAlt || ""}
                fill
                priority={priority}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-hero
      ref={containerRef}
      className={cn(
        "on-dark relative isolate flex w-full flex-col overflow-hidden bg-carbon-950",
        heights[data.height],
        data.align === "center"
          ? "items-center justify-center text-center"
          : "items-start justify-end text-left",
      )}
    >
      {/* Fotografía: siempre presente, es el fallback real */}
      {posterUrl && (
        <Image
          src={posterUrl}
          alt={media.imageAlt || ""}
          fill
          priority={priority}
          sizes="100vw"
          className={cn(
            // En mobile el recorte vertical de una foto panoramica cae sobre el fondo
            // y deja al producto afuera: se corre el encuadre hacia el vino.
            "-z-10 object-cover object-[74%_center] transition-opacity duration-[1100ms] md:object-center",
            showVideo ? "opacity-0" : "opacity-100 img-breathe",
          )}
        />
      )}

      {/* Video: mejora progresiva */}
      {showVideo && (
        <video
          ref={videoRef}
          poster={posterUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 -z-10 size-full object-cover"
        >
          {media.videoMobileUrl && (
            <source src={media.videoMobileUrl} media="(max-width: 767px)" type="video/mp4" />
          )}
          {media.videoDesktopUrl && <source src={media.videoDesktopUrl} type="video/mp4" />}
        </video>
      )}

      {/* Scrim para garantizar contraste del texto */}
      {data.overlay !== "none" && !textoOscuro && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10",
            data.overlay === "scrim-bottom" && "scrim-bottom",
            data.overlay === "scrim-side" && "scrim-side",
            data.overlay === "scrim-full" && "scrim-full",
          )}
        />
      )}

      {data.overlay !== "none" && textoOscuro && (
        <>
          {/*
            Dos velos distintos porque el encuadre cambia: en desktop el texto cae
            sobre pared y basta con el degradado corto; en mobile el recorte acerca
            la botella al texto, asi que el velo llega mas a la derecha. Se corta
            en 76% para no lavar la etiqueta.
          */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 sm:hidden"
            style={{
              background:
                "linear-gradient(to right, rgb(247 243 236 / 0.80) 0%, rgb(247 243 236 / 0.50) 45%, rgb(247 243 236 / 0.34) 68%, rgb(247 243 236 / 0) 76%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 hidden sm:block"
            style={{
              background:
                "linear-gradient(to right, rgb(247 243 236 / 0.72) 0%, rgb(247 243 236 / 0.34) 42%, rgb(247 243 236 / 0) 68%)",
            }}
          />
        </>
      )}

      {/*
        El video es más luminoso y cambiante que un poster fijo: se suma una
        capa tenue para que el titular mantenga contraste AA en todos los frames.
      */}
      {showVideo && <div aria-hidden className="absolute inset-0 -z-10 bg-carbon-950/35" />}

      <div
        className={cn(
          "relative mx-auto w-full max-w-[1440px] px-gutter",
          data.align === "center" ? "py-28 lg:py-32" : "pb-20 pt-32 lg:pb-28",
          data.align === "center" && "flex flex-col items-center",
        )}
      >
        {data.showLogo && logoUrl && (
          <Image
            src={logoUrl}
            alt={companyName ?? ""}
            width={260}
            height={52}
            priority={priority}
            className="mb-9 h-9 w-auto lg:h-11"
          />
        )}

        {data.eyebrow && (
          <p className={cn("eyebrow mb-5 opacity-0", textoOscuro ? "text-carbon-800 sm:text-stone-600" : "text-linen-300") + " animate-[reveal-up_800ms_cubic-bezier(0.16,1,0.3,1)_200ms_forwards]"}>
            {data.eyebrow}
          </p>
        )}

        <h1
          className={cn(
            "font-display opacity-0",
            textoOscuro ? "font-medium uppercase text-carbon-900" : "font-light text-bone",
            "animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_320ms_forwards]",
            // En mobile el producto ocupa el borde derecho: el texto se corta antes
            // para no quedar sobre el vidrio oscuro de la botella.
            data.scale === "hero"
              ? "max-w-[74%] text-display-2xl sm:max-w-[26ch]"
              : "max-w-[74%] text-display-xl sm:max-w-[19ch]",
            data.align === "center" && "mx-auto",
          )}
        >
          {data.title}
          {data.titleAccent && (
            <>
              <br />
              <span className={cn("accent-italic", textoOscuro ? "font-light normal-case text-carbon-800" : "text-linen-200")}>
                {data.titleAccent}
              </span>
            </>
          )}
        </h1>

        {data.subtitle && (
          <p
            className={cn(
              "mt-7 max-w-[74%] text-lead opacity-0 sm:max-w-[52ch]",
              textoOscuro ? "text-carbon-800 sm:text-stone-600" : "text-linen-200",
              "animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_460ms_forwards]",
              data.align === "center" && "mx-auto",
            )}
          >
            {data.subtitle}
          </p>
        )}

        {(data.ctaPrimary.label || data.ctaSecondary.label) && (
          <div
            className={cn(
              "mt-10 flex flex-col items-start gap-3 opacity-0 sm:flex-row sm:items-center",
              "animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_600ms_forwards]",
              data.align === "center" && "justify-center",
            )}
          >
            {data.ctaPrimary.label && (
              <Link
                href={data.ctaPrimary.href}
                className={buttonVariants({ variant: "primary", size: "lg", uppercase: true })}
              >
                {data.ctaPrimary.label}
              </Link>
            )}
            {data.ctaSecondary.label && (
              <Link
                href={data.ctaSecondary.href}
                className={buttonVariants({ variant: textoOscuro ? "outline" : "ghostLight", size: "lg", uppercase: true })}
              >
                {data.ctaSecondary.label}
              </Link>
            )}
          </div>
        )}
      </div>

      {data.height === "full" && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-7 flex items-center gap-3 text-linen-300/70",
            "opacity-0 animate-[fade-in_900ms_ease-out_1200ms_forwards]",
            data.align === "center" ? "left-1/2 -translate-x-1/2" : "left-gutter",
          )}
        >
          {data.scrollCue && <span className="eyebrow">{data.scrollCue}</span>}
          <ChevronDown className="size-4 animate-bounce [animation-duration:2.4s]" />
        </div>
      )}
    </section>
  );
}
