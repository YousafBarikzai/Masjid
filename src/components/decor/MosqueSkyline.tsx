/**
 * Hand-drawn mosque skyline used as a decorative hero illustration (in place of
 * a photo). Pure SVG — crisp at any size and easy to swap for a real photo
 * later. The silhouette uses `currentColor`; warm gold "window" lights are baked
 * in to give a calm dusk feel.
 */
export default function MosqueSkyline({ className = "" }: { className?: string }) {
  // pointed dome: width 2*hw at base (by), meeting a point at (cx, py)
  const dome = (cx: number, hw: number, by: number, py: number) =>
    `M${cx - hw} ${by} Q${cx - hw} ${py} ${cx} ${py} Q${cx + hw} ${py} ${cx + hw} ${by} Z`;

  const minaret = (cx: number) => (
    <g>
      <rect x={cx - 14} y={120} width={28} height={180} rx={3} />
      <rect x={cx - 21} y={150} width={42} height={11} rx={3} />
      <rect x={cx - 21} y={196} width={42} height={9} rx={3} />
      <path d={dome(cx, 14, 120, 80)} />
      <rect x={cx - 2} y={62} width={4} height={20} rx={2} />
      <circle cx={cx} cy={58} r={5} />
    </g>
  );

  return (
    <svg
      className={className}
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <rect x="280" y="262" width="880" height="58" />
        {minaret(360)}
        {minaret(1080)}
        <rect x="470" y="205" width="140" height="95" rx="3" />
        <path d={dome(540, 56, 205, 120)} />
        <rect x="538" y="104" width="4" height="18" rx="2" />
        <circle cx="540" cy="100" r="4" />
        <rect x="830" y="205" width="140" height="95" rx="3" />
        <path d={dome(900, 56, 205, 120)} />
        <rect x="898" y="104" width="4" height="18" rx="2" />
        <circle cx="900" cy="100" r="4" />
        <rect x="632" y="170" width="176" height="130" rx="4" />
        <path d={dome(720, 92, 172, 44)} />
        <rect x="718" y="18" width="4" height="28" rx="2" />
        {/* crescent finial */}
        <path d="M720 4a14 14 0 1 0 10 24 11 11 0 1 1 0-21 14 14 0 0 0-10-3z" />
      </g>
      {/* warm window lights */}
      <g fill="#f0dca0">
        <rect x="672" y="212" width="12" height="26" rx="6" />
        <rect x="700" y="212" width="12" height="26" rx="6" />
        <rect x="728" y="212" width="12" height="26" rx="6" />
        <rect x="756" y="212" width="12" height="26" rx="6" />
        <rect x="514" y="238" width="9" height="20" rx="4.5" />
        <rect x="540" y="238" width="9" height="20" rx="4.5" />
        <rect x="566" y="238" width="9" height="20" rx="4.5" />
        <rect x="874" y="238" width="9" height="20" rx="4.5" />
        <rect x="900" y="238" width="9" height="20" rx="4.5" />
        <rect x="926" y="238" width="9" height="20" rx="4.5" />
        <circle cx="360" cy="176" r="3.5" />
        <circle cx="1080" cy="176" r="3.5" />
      </g>
    </svg>
  );
}
