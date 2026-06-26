/* iOS launch (splash) screens for the installed PWA. iOS only shows a branded
   launch image when a matching apple-touch-startup-image is provided for the
   device's exact CSS size + pixel ratio; otherwise it shows a blank screen.
   Images live in /public/splash (generated from the app icon). Render inside
   <head>. Covers current/recent iPhones; unmatched devices fall back to the
   manifest background colour. */

type Entry = { w: number; h: number; dw: number; dh: number; ratio: number };

const ENTRIES: Entry[] = [
  { w: 1290, h: 2796, dw: 430, dh: 932, ratio: 3 }, // 15/14 Pro Max
  { w: 1179, h: 2556, dw: 393, dh: 852, ratio: 3 }, // 15/15 Pro/14 Pro
  { w: 1284, h: 2778, dw: 428, dh: 926, ratio: 3 }, // 14 Plus/13 Pro Max
  { w: 1170, h: 2532, dw: 390, dh: 844, ratio: 3 }, // 12/13/14
  { w: 1125, h: 2436, dw: 375, dh: 812, ratio: 3 }, // X/XS/11 Pro/12-13 mini
  { w: 1242, h: 2688, dw: 414, dh: 896, ratio: 3 }, // XS Max/11 Pro Max
  { w: 828, h: 1792, dw: 414, dh: 896, ratio: 2 }, // XR/11
  { w: 750, h: 1334, dw: 375, dh: 667, ratio: 2 }, // SE/8/7/6s
  { w: 1242, h: 2208, dw: 414, dh: 736, ratio: 3 }, // 8 Plus
];

export default function IosSplash() {
  return (
    <>
      {ENTRIES.map((e) => (
        <link
          key={`${e.w}x${e.h}`}
          rel="apple-touch-startup-image"
          href={`/splash/splash-${e.w}x${e.h}.png`}
          media={`screen and (device-width: ${e.dw}px) and (device-height: ${e.dh}px) and (-webkit-device-pixel-ratio: ${e.ratio}) and (orientation: portrait)`}
        />
      ))}
    </>
  );
}
