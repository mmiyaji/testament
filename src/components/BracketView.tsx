import { useTranslation } from "react-i18next";
import type { Match } from "@/lib/tournament";
import { MatchCard } from "./MatchCard";

interface Props {
  matches: Match[];
  onSelectWinner: (matchId: string, winner: string) => void;
  onUndo?: (matchId: string) => void;
  bracket?: string;
}

export function BracketView({ matches, onSelectWinner, onUndo, bracket }: Props) {
  const { t } = useTranslation();

  const filtered = bracket
    ? matches.filter((m) => m.bracket === bracket)
    : matches;

  const rounds = [...new Set(filtered.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  const maxRound = Math.max(...rounds);
  const roundLabels = (round: number) => {
    if (round === maxRound) return t("bracket.final");
    if (round === maxRound - 1 && maxRound > 2) return t("bracket.semiFinal");
    return t("bracket.round", { round });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
      {rounds.map((round) => {
        const roundMatches = filtered.filter((m) => m.round === round);
        return (
          <div key={round} className="flex-shrink-0 min-w-[220px] flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
              {roundLabels(round)}
            </div>
            <div className="space-y-2 flex flex-col justify-around flex-1">
              {roundMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onSelectWinner={onSelectWinner}
                  onUndo={onUndo}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
