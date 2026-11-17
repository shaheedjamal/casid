interface CasidLogoProps {
  inverted?: boolean;
}

export function CasidLogo({ inverted = false }: CasidLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="6"
          fill={inverted ? '#1E40AF' : '#1E3A8A'}
        />
        <path
          d="M16 7.5V24.5M7.5 16H24.5"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="16"
          cy="16"
          r="5"
          fill={inverted ? '#1E40AF' : '#1E3A8A'}
          stroke="#93C5FD"
          strokeWidth="1.75"
        />
      </svg>
      <span
        className={`font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0 ${
          inverted ? 'text-white' : 'text-slate-900'
        }`}
      >
        CASID PHARMA
      </span>
    </span>
  );
}
