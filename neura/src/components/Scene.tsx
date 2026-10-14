export function Scene({
  scene = "friend",
  compact = false,
}: {
  scene?: string;
  compact?: boolean;
}) {
  return (
    <svg
      className={"scene " + (compact ? "compact" : "")}
      viewBox="0 0 700 330"
      role="img"
      aria-label={`Авторская иллюстрация: Айко и Мика, ${scene}`}
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#e4f5ff" />
          <stop offset="1" stopColor="#f4fbff" />
        </linearGradient>
        <linearGradient id="robot" x2="1" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#c8e2f8" />
        </linearGradient>
      </defs>
      <rect width="700" height="330" rx="24" fill="url(#sky)" />
      <circle cx="585" cy="65" r="29" fill="#ffe5a4" />
      <path d="M0 265 Q150 205 350 262 T700 244V330H0Z" fill="#d3eee6" />
      <path d="M0 295Q280 240 700 300V330H0Z" fill="#bce2d4" />
      <g fill="#fff" opacity=".9">
        <ellipse cx="135" cy="70" rx="57" ry="17" />
        <circle cx="125" cy="54" r="24" />
        <ellipse cx="470" cy="105" rx="38" ry="12" />
      </g>
      <g transform="translate(170 105)">
        <ellipse cx="80" cy="183" rx="70" ry="10" fill="#234e73" opacity=".1" />
        <path
          d="M53 145v32M107 145v32"
          stroke="#547de2"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <rect
          x="30"
          y="85"
          width="100"
          height="76"
          rx="28"
          fill="url(#robot)"
        />
        <path
          d="M30 110L8 137M130 110l25-28"
          stroke="#92b9eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <rect
          x="10"
          y="0"
          width="140"
          height="103"
          rx="36"
          fill="url(#robot)"
        />
        <rect x="26" y="20" width="108" height="61" rx="24" fill="#244365" />
        <ellipse cx="57" cy="46" rx="8" ry="12" fill="#7ce4f3" />
        <ellipse cx="104" cy="46" rx="8" ry="12" fill="#7ce4f3" />
        <path
          d="M68 64q12 10 24 0"
          fill="none"
          stroke="#7ce4f3"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M80 0v-15" stroke="#5487dd" strokeWidth="5" />
        <circle cx="80" cy="-19" r="8" fill="#56c9bd" />
        <circle cx="80" cy="120" r="13" fill="#5689ec" />
        <path d="M74 120h12M80 114v12" stroke="white" strokeWidth="3" />
      </g>
      <g transform="translate(423 145) scale(.78)">
        <path
          d="M35 125v45M95 125v45"
          stroke="#d9a176"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <rect x="10" y="60" width="110" height="90" rx="28" fill="#ffcfa8" />
        <rect x="0" y="0" width="130" height="88" rx="32" fill="#ffe3c4" />
        <rect x="15" y="17" width="100" height="51" rx="21" fill="#655465" />
        <circle cx="44" cy="37" r="7" fill="#ffe5af" />
        <circle cx="88" cy="37" r="7" fill="#ffe5af" />
        <path
          d="M53 53q12 10 24 0"
          stroke="#ffe5af"
          fill="none"
          strokeWidth="3"
        />
        <path
          d="M10 100l-27-16M120 100l20 22"
          stroke="#eab58a"
          strokeWidth="15"
          strokeLinecap="round"
        />
      </g>
      {scene === "rain" ? (
        <g stroke="#76b7e4" strokeWidth="4">
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${40 + i * 42} ${100 + (i % 3) * 30}l-7 17`} />
          ))}
        </g>
      ) : scene === "gift" ? (
        <g>
          <rect x="340" y="235" width="55" height="47" rx="5" fill="#a294df" />
          <path d="M367 235v47M337 247h61" stroke="#ffe7a6" strokeWidth="7" />
        </g>
      ) : scene === "drawing" ? (
        <g>
          <path d="M330 240l28-8 5 23-9 5 10 17-30 7Z" fill="white" />
          <path d="M369 232l24-6 9 48-31 7-9-20 9-8Z" fill="white" />
        </g>
      ) : scene === "rule" ? (
        <g fill="#79a8ef">
          <rect x="340" y="250" width="28" height="28" rx="4" />
          <circle cx="390" cy="265" r="16" />
          <path d="M350 235l15-30 15 30Z" fill="#ecb27d" />
        </g>
      ) : scene === "help" || scene === "final" ? (
        <g>
          <rect x="345" y="225" width="45" height="59" rx="5" fill="#72b6a7" />
          <path d="M352 234h30M352 242h25" stroke="#fff" strokeWidth="3" />
        </g>
      ) : (
        <g>
          <circle cx="365" cy="268" r="22" fill="#f5bf70" />
          <path
            d="M344 268h42M365 246q-18 22 0 44"
            fill="none"
            stroke="#fff1d7"
            strokeWidth="3"
          />
        </g>
      )}
      <g fill="#78bfa3">
        <path d="M70 280v-45M70 263q-25 0-25-20 25 0 25 20M70 253q25 0 25-20-25 0-25 20" />
        <path d="M625 282v-38M625 268q-24 0-24-18 24 0 24 18M625 258q24 0 24-18-24 0-24 18" />
      </g>
    </svg>
  );
}
