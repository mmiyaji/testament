import type React from "react";
import type { TournamentMode } from "@/lib/tournament";

const iconStyle = { flexShrink: 0 } as const;

function SingleEliminationIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" style={iconStyle}>
      <circle cx="8" cy="8" r="3" fill="#999" />
      <circle cx="8" cy="22" r="3" fill="#999" />
      <circle cx="8" cy="34" r="3" fill="#999" />
      <circle cx="8" cy="48" r="3" fill="#999" />
      <line x1="11" y1="8" x2="30" y2="15" stroke="#bbb" strokeWidth="2" />
      <line x1="11" y1="22" x2="30" y2="15" stroke="#bbb" strokeWidth="2" />
      <line x1="11" y1="34" x2="30" y2="41" stroke="#bbb" strokeWidth="2" />
      <line x1="11" y1="48" x2="30" y2="41" stroke="#bbb" strokeWidth="2" />
      <circle cx="30" cy="15" r="3" fill="#999" />
      <circle cx="30" cy="41" r="3" fill="#999" />
      <line x1="33" y1="15" x2="56" y2="28" stroke="#bbb" strokeWidth="2" />
      <line x1="33" y1="41" x2="56" y2="28" stroke="#bbb" strokeWidth="2" />
      <circle cx="56" cy="28" r="3" fill="#999" />
      <line x1="59" y1="28" x2="72" y2="28" stroke="#bbb" strokeWidth="2" />
      <circle cx="72" cy="28" r="4" fill="none" stroke="#bbb" strokeWidth="2" />
    </svg>
  );
}

function DoubleEliminationIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" style={iconStyle}>
      <circle cx="8" cy="6" r="2.5" fill="#999" />
      <circle cx="8" cy="16" r="2.5" fill="#999" />
      <circle cx="8" cy="26" r="2.5" fill="#999" />
      <circle cx="8" cy="36" r="2.5" fill="#999" />
      <line x1="11" y1="6" x2="28" y2="11" stroke="#bbb" strokeWidth="2" />
      <line x1="11" y1="16" x2="28" y2="11" stroke="#bbb" strokeWidth="2" />
      <line x1="11" y1="26" x2="28" y2="31" stroke="#bbb" strokeWidth="2" />
      <line x1="11" y1="36" x2="28" y2="31" stroke="#bbb" strokeWidth="2" />
      <circle cx="28" cy="11" r="2.5" fill="#999" />
      <circle cx="28" cy="31" r="2.5" fill="#999" />
      <line x1="31" y1="11" x2="48" y2="21" stroke="#bbb" strokeWidth="2" />
      <line x1="31" y1="31" x2="48" y2="21" stroke="#bbb" strokeWidth="2" />
      <circle cx="48" cy="21" r="2.5" fill="#999" />
      <circle cx="18" cy="46" r="2" fill="#999" />
      <circle cx="18" cy="52" r="2" fill="#999" />
      <line x1="20" y1="46" x2="33" y2="49" stroke="#ddd" strokeWidth="1.5" />
      <line x1="20" y1="52" x2="33" y2="49" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="33" cy="49" r="2" fill="#999" />
      <line x1="35" y1="49" x2="48" y2="49" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="48" cy="49" r="2" fill="#999" />
      <line x1="48" y1="21" x2="66" y2="28" stroke="#bbb" strokeWidth="2" />
      <line x1="48" y1="49" x2="66" y2="28" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="66" cy="28" r="3" fill="#999" />
    </svg>
  );
}

function RoundRobinIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" style={iconStyle}>
      <line x1="40" y1="8" x2="59" y2="20" stroke="#ddd" strokeWidth="1.5" />
      <line x1="40" y1="8" x2="52" y2="44" stroke="#ddd" strokeWidth="1.5" />
      <line x1="40" y1="8" x2="28" y2="44" stroke="#ddd" strokeWidth="1.5" />
      <line x1="40" y1="8" x2="21" y2="20" stroke="#ddd" strokeWidth="1.5" />
      <line x1="59" y1="20" x2="52" y2="44" stroke="#ddd" strokeWidth="1.5" />
      <line x1="59" y1="20" x2="28" y2="44" stroke="#ddd" strokeWidth="1.5" />
      <line x1="59" y1="20" x2="21" y2="20" stroke="#ddd" strokeWidth="1.5" />
      <line x1="52" y1="44" x2="28" y2="44" stroke="#ddd" strokeWidth="1.5" />
      <line x1="52" y1="44" x2="21" y2="20" stroke="#ddd" strokeWidth="1.5" />
      <line x1="28" y1="44" x2="21" y2="20" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="40" cy="8" r="3" fill="#999" />
      <circle cx="59" cy="20" r="3" fill="#999" />
      <circle cx="52" cy="44" r="3" fill="#999" />
      <circle cx="28" cy="44" r="3" fill="#999" />
      <circle cx="21" cy="20" r="3" fill="#999" />
    </svg>
  );
}

function SwissIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" style={iconStyle}>
      <circle cx="10" cy="8" r="2.5" fill="#999" />
      <line x1="13" y1="8" x2="23" y2="8" stroke="#bbb" strokeWidth="2" />
      <circle cx="26" cy="8" r="2.5" fill="#999" />
      <circle cx="38" cy="8" r="2.5" fill="#999" />
      <line x1="41" y1="8" x2="51" y2="8" stroke="#bbb" strokeWidth="2" />
      <circle cx="54" cy="8" r="2.5" fill="#999" />
      <circle cx="66" cy="8" r="2.5" fill="#999" />
      <circle cx="10" cy="28" r="2.5" fill="#999" />
      <line x1="13" y1="28" x2="23" y2="28" stroke="#bbb" strokeWidth="2" />
      <circle cx="26" cy="28" r="2.5" fill="#999" />
      <circle cx="38" cy="28" r="2.5" fill="#999" />
      <line x1="41" y1="28" x2="51" y2="28" stroke="#bbb" strokeWidth="2" />
      <circle cx="54" cy="28" r="2.5" fill="#999" />
      <circle cx="66" cy="28" r="2.5" fill="#999" />
      <circle cx="10" cy="48" r="2.5" fill="#999" />
      <line x1="13" y1="48" x2="23" y2="48" stroke="#bbb" strokeWidth="2" />
      <circle cx="26" cy="48" r="2.5" fill="#999" />
      <circle cx="38" cy="48" r="2.5" fill="#999" />
      <line x1="41" y1="48" x2="51" y2="48" stroke="#bbb" strokeWidth="2" />
      <circle cx="54" cy="48" r="2.5" fill="#999" />
      <circle cx="66" cy="48" r="2.5" fill="#999" />
      <text x="1" y="20" fontSize="7" fill="#ccc" fontFamily="sans-serif">R1</text>
      <text x="1" y="40" fontSize="7" fill="#ccc" fontFamily="sans-serif">R2</text>
      <text x="1" y="56" fontSize="7" fill="#ccc" fontFamily="sans-serif">R3</text>
    </svg>
  );
}

function EndlessIcon() {
  return (
    <svg width="80" height="56" viewBox="0 0 80 56" style={iconStyle}>
      <circle cx="26" cy="28" r="4" fill="#999" />
      <circle cx="54" cy="28" r="4" fill="#999" />
      <path d="M 30 22 Q 40 12 50 22" fill="none" stroke="#bbb" strokeWidth="2" />
      <polygon points="50,22 46,16 48,23" fill="#bbb" />
      <path d="M 50 34 Q 40 44 30 34" fill="none" stroke="#bbb" strokeWidth="2" />
      <polygon points="30,34 34,40 32,33" fill="#bbb" />
      <path d="M 18 28 Q 10 18 14 28 Q 10 38 18 28" fill="none" stroke="#ddd" strokeWidth="1.5" />
      <path d="M 62 28 Q 70 18 66 28 Q 70 38 62 28" fill="none" stroke="#ddd" strokeWidth="1.5" />
    </svg>
  );
}

const MODE_ICONS: Record<TournamentMode, () => React.ReactNode> = {
  "single-elimination": SingleEliminationIcon,
  "double-elimination": DoubleEliminationIcon,
  "round-robin": RoundRobinIcon,
  swiss: SwissIcon,
  endless: EndlessIcon,
};

export function ModeIcon({ mode }: { mode: TournamentMode }) {
  const Icon = MODE_ICONS[mode];
  return <Icon />;
}
