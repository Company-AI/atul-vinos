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

  const heights = {
    full: "min-h-[88svh] lg:min-h-[100svh]",
    tall: "min-h-[72svh] lg:min-h-[82svh]",
    medium: "min-h-[56svh] lg:min-h-[64svh]",
  } as const;

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
            "-z-10 object-cover transition-opacity duration-[1100ms]",
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
      {data.overlay !== "none" && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10",
            data.overlay === "scrim-bottom" ? "scrim-bottom" : "scrim-full",
          )}
        />
      )}

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
          <p className="eyebrow mb-5 text-linen-300 opacity-0 animate-[reveal-up_800ms_cubic-bezier(0.16,1,0.3,1)_200ms_forwards]">
            {data.eyebrow}
          </p>
        )}

        <h1
          className={cn(
            "max-w-[19ch] font-display text-display-xl font-light text-bone opacity-0",
            "animate-[reveal-up_900ms_cubic-bezier(0.16,1,0.3,1)_320ms_forwards]",
            data.align === "center" && "mx-auto",
          )}
        >
          {data.title}
        </h1>

        {data.subtitle && (
          <p
            className={cn(
              "mt-6 max-w-[52ch] text-[16px] leading-relaxed text-linen-200 opacity-0 lg:text-[17px]",
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
              "mt-10 flex flex-col gap-3 opacity-0 sm:flex-row sm:items-center",
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
                className={buttonVariants({ variant: "ghostLight", size: "lg", uppercase: true })}
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
          className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-linen-300/70"
        >
          <ChevronDown className="size-5 animate-bounce [animation-duration:2.4s]" />
        </div>
      )}
    </section>
  );
}
