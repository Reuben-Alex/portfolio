"use client";

import { useState } from "react";

interface Props {
  /** YouTube video id. */
  id: string;
  title: string;
}

/** A thumbnail that becomes the YouTube player on click, so nothing heavy loads until asked. */
export function VideoEmbed({ id, title }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-bg">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            aria-label={`Play video: ${title}`}
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a remote thumbnail, lazy-loaded */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-bg shadow-[0_0_30px_rgb(255_179_71/0.5)] transition-transform group-hover:scale-110"
            >
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span
              aria-hidden
              className="absolute bottom-2 left-3 font-mono text-[11px] text-ink drop-shadow"
            >
              {title}
            </span>
          </button>
        )}
      </div>
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block font-mono text-[11px] text-muted underline-offset-4 transition-colors hover:text-ice hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        Watch on YouTube <span aria-hidden>↗</span>
      </a>
    </div>
  );
}
