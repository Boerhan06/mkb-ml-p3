"use client";

export default function BackgroundGraphics() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-gradient-to-br from-[#E3EED4]/50 via-[#F3F7EE] to-[#E3EED4]/40"
    >
      {/* 1. Base Graph Paper Grid (Fine Square Grid across full viewport) */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(55, 85, 52, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(55, 85, 52, 0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Reusable SVG Filters for 3D Soft Drop Shadows */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Dual-layer soft shadow for physical paper cutout / claymorphic elevation */}
          <filter id="soft-drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="3" dy="9" stdDeviation="7" floodColor="#0F2A1D" floodOpacity="0.14" />
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#375534" floodOpacity="0.08" />
          </filter>
          <filter id="clay-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="4" dy="12" stdDeviation="9" floodColor="#0F2A1D" floodOpacity="0.16" />
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#375534" floodOpacity="0.10" />
          </filter>
          <filter id="subtle-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#375534" floodOpacity="0.12" />
          </filter>
        </defs>
      </svg>

      {/* 2. Left-Side Design Graphic Elements */}
      <svg
        className="absolute left-0 top-0 h-full w-[460px] max-w-[50vw]"
        viewBox="0 0 320 1024"
        fill="none"
        preserveAspectRatio="xMinYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-Left: Smooth Wavy / Squiggle Line */}
        <path
          d="M 130 42 C 145 20, 158 20, 172 42 C 186 64, 199 64, 213 42 C 227 20, 240 20, 254 42 C 265 58, 274 58, 282 42"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#soft-drop-shadow)"
        />

        {/* Top-Left: Large Circular Arc Outline */}
        <circle
          cx="0"
          cy="158"
          r="96"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="14"
          filter="url(#clay-shadow)"
        />

        {/* Middle-Left: Vertical Stack of 4 Cross Marks (X X X X) */}
        {[368, 412, 456, 500].map((yPos, idx) => (
          <g key={idx} filter="url(#soft-drop-shadow)">
            <line
              x1="38"
              y1={yPos - 12}
              x2="62"
              y2={yPos + 12}
              stroke="#FFFFFF"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <line
              x1="62"
              y1={yPos - 12}
              x2="38"
              y2={yPos + 12}
              stroke="#FFFFFF"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Bottom-Left: Concentric 3 Circular Arches */}
        <g filter="url(#clay-shadow)">
          {/* Outer Arc (r=188) */}
          <path
            d="M 0 742 A 188 188 0 0 1 188 930"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="13"
          />
          {/* Middle Arc (r=142) */}
          <path
            d="M 0 788 A 142 142 0 0 1 142 930"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="13"
          />
          {/* Inner Arc (r=96) */}
          <path
            d="M 0 834 A 96 96 0 0 1 96 930"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="13"
          />
        </g>

        {/* Bottom-Left: Small Floating Circular Ring */}
        <circle
          cx="236"
          cy="960"
          r="15"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5"
          filter="url(#soft-drop-shadow)"
        />
      </svg>

      {/* 3. Right-Side Design Graphic Elements */}
      <svg
        className="absolute right-0 top-0 h-full w-[460px] max-w-[50vw]"
        viewBox="256 0 320 1024"
        fill="none"
        preserveAspectRatio="xMaxYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-Right: L-Frame Corner Outline */}
        <path
          d="M 400 0 L 400 180 L 576 180"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinejoin="miter"
          filter="url(#clay-shadow)"
        />

        {/* Top-Right: Grey Accent Bar */}
        <rect
          x="430"
          y="166"
          width="146"
          height="34"
          rx="3"
          fill="#AEC3B0"
          filter="url(#clay-shadow)"
        />

        {/* Top-Right: Corner Dot Matrix Cluster (6x6 Dot Grid) */}
        <g filter="url(#subtle-shadow)">
          {[374, 392, 410, 428, 446].map((x) =>
            [72, 90, 108, 126, 144, 162, 180, 198, 216].map((y) => {
              // Only render dots inside the L-shaped corner region
              if (x < 400 && y > 180) return null;
              return (
                <circle
                  key={`top-dot-${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#FFFFFF"
                />
              );
            })
          )}
        </g>

        {/* Middle-Right: Solid White Semicircular Disc */}
        <circle
          cx="576"
          cy="465"
          r="76"
          fill="#FFFFFF"
          filter="url(#clay-shadow)"
        />

        {/* Bottom-Right: Two Vertical Sage Bar Blocks */}
        {/* Shorter Bar (Left) */}
        <rect
          x="354"
          y="935"
          width="36"
          height="75"
          rx="3"
          fill="#AEC3B0"
          filter="url(#clay-shadow)"
        />
        {/* Taller Bar (Right) */}
        <rect
          x="408"
          y="870"
          width="34"
          height="140"
          rx="3"
          fill="#6B9071"
          filter="url(#clay-shadow)"
        />

        {/* Bottom-Right: Dense Dot Matrix Panel (5 columns x 18 rows) */}
        <g filter="url(#subtle-shadow)">
          {[506, 524, 542, 560, 576].map((x) =>
            Array.from({ length: 19 }, (_, i) => 660 + i * 19).map((y) => (
              <circle
                key={`bot-dot-${x}-${y}`}
                cx={x}
                cy={y}
                r="3.5"
                fill="#FFFFFF"
              />
            ))
          )}
        </g>
      </svg>
    </div>
  );
}
