"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

export type BackgroundMediaData = {
  imageUrl: string;
  imageAlt?: string;
  posterUrl?: string;
  videoDesktopUrl?: string;
  videoMobileUrl?: string;
};

/**
 * Fondo de sección con video opcional. Misma política que el hero (spec §5):
 * la fotografía siempre está, el video es una mejora que solo se carga cuando
 * conviene y se pausa al salir de pantalla.
 */
export function BackgroundMedia({
  media,
  className,
  imageClassName,
  priority = false,
  sizes = "100vw",
}: {
  media: BackgroundMediaData;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mountVideo, setMountVideo] = useState(false);
  const [failed, setFailed] = useState(false);

  const poster = media.posterUrl || media.imageUrl;
  const hasVideo = Boolean(media.videoDesktopUrl || media.videoMobileUrl);

  useEffect(() => {
    if (!hasVideo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && ["slow-2g", "2g", "3g"].includes(connection.effectiveType)) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile && !media.videoMobileUrl) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMountVideo(true);
            videoRef.current?.play().catch(() => setFailed(true));
          } else {
            videoRef.current?.pause();
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasVideo, media.videoMobileUrl]);

  const showVideo = mountVideo && !failed;

  return (
    <div ref={containerRef} className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      {poster && (
        <Image
          src={poster}
          alt={media.imageAlt ?? ""}
          fill
          priority={priority}
          sizes={sizes}
          className={cn(
            "object-cover transition-opacity duration-[1100ms]",
            showVideo ? "opacity-0" : "opacity-100",
            imageClassName,
          )}
        />
      )}

      {showVideo && (
        <video
          ref={videoRef}
          poster={poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        >
          {media.videoMobileUrl && (
            <source src={media.videoMobileUrl} media="(max-width: 767px)" type="video/mp4" />
          )}
          {media.videoDesktopUrl && <source src={media.videoDesktopUrl} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}
