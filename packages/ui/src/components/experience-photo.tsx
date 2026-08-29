import * as React from 'react';

import { ExperienceGlyphMark } from './experience-glyph';

/**
 * What an experience shows where its photograph would be.
 *
 * Not a missing image — a photograph that hasn't been taken yet. The
 * category's own mark, a hairline, and a caption that says so.
 *
 * It lives here because three surfaces show the same experience and each had
 * its own answer: the catalogue card drew this, the home card rendered
 * `<Image src="">` and got the browser's broken-image glyph, and the detail
 * sheet fell back to a stock file that no longer exists. A guest met all
 * three in one session.
 *
 * `scale` tracks the frame: at 58px the caption is noise, and at full-bleed
 * on the detail sheet the card's 40px mark disappears.
 */
export function ExperiencePhotoPlaceholder({
  glyph,
  scale = 'card',
  className,
}: {
  glyph?: string | null;
  /** `compact` ≈ 58px tall, `card` ≈ 112–170px, `hero` = a full-bleed header. */
  scale?: 'compact' | 'card' | 'hero';
  className?: string;
}) {
  const mark =
    scale === 'compact' ? 'size-7' : scale === 'hero' ? 'size-16' : 'size-10';

  return (
    <div
      className={[
        'flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-[#EAE5DC] to-[#DED7CB] px-4 text-center',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      <ExperienceGlyphMark
        glyph={glyph}
        className={`${mark} text-[#9E9585] opacity-75`}
      />
      {scale !== 'compact' && (
        <>
          <span
            className={`h-px bg-[#B4AC9E] opacity-60 ${scale === 'hero' ? 'w-10' : 'w-6'}`}
            aria-hidden
          />
          <span
            className={`uppercase text-[#B4AC9E] ${
              scale === 'hero'
                ? 'text-[10px] tracking-[3px]'
                : 'text-[8px] tracking-[2.2px]'
            }`}
          >
            Photograph to follow
          </span>
        </>
      )}
    </div>
  );
}
