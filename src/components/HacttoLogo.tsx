import React from 'react';

interface HacttoLogoProps {
  size?: number;
  className?: string;
}

export const HacttoLogo: React.FC<HacttoLogoProps> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Hactto Logo"
    >
      <defs>
        {/* Modern Gradient for Capital H */}
        <linearGradient
          id="hactto-comp-h-grad"
          x1="5.5"
          y1="7.5"
          x2="24.5"
          y2="26.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#3182f6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* 3D Spherical Radial Gradient for Yellow Lotto Ball */}
        <radialGradient id="hactto-comp-lotto-yellow" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fffde7" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="65%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </radialGradient>

        {/* Subtle Drop Shadow for Lotto Ball Separation */}
        <filter
          id="hactto-comp-ball-shadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.2"
            floodColor="#0f172a"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* Capital Letter H */}
      <rect
        x="5.5"
        y="7.5"
        width="5.5"
        height="19"
        rx="2"
        fill="url(#hactto-comp-h-grad)"
      />
      <rect
        x="9.5"
        y="14"
        width="12"
        height="5"
        rx="1.5"
        fill="url(#hactto-comp-h-grad)"
      />
      <rect
        x="18"
        y="7.5"
        width="5.5"
        height="19"
        rx="2"
        fill="url(#hactto-comp-h-grad)"
      />

      {/* Yellow Lotto Ball perched at the Top-Right of H */}
      <g filter="url(#hactto-comp-ball-shadow)">
        <circle
          cx="23.5"
          cy="7"
          r="5"
          fill="url(#hactto-comp-lotto-yellow)"
          stroke="#ffffff"
          strokeWidth="0.9"
        />
        <circle cx="23.5" cy="7" r="2.3" fill="#ffffff" />
        <text
          x="23.5"
          y="8.1"
          fontSize="2.8"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
          fill="#854d0e"
        >
          7
        </text>
        <ellipse
          cx="22"
          cy="4.8"
          rx="1.3"
          ry="0.65"
          transform="rotate(-30 22 4.8)"
          fill="#ffffff"
          opacity="0.85"
        />
      </g>
    </svg>
  );
};
