import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/tournament";

interface Props {
  match: Match;
  onSelectWinner: (matchId: string, winner: string) => void;
  onDraw?: (matchId: string) => void;
  onUndo?: (matchId: string) => void;
  allowDraw?: boolean;
}

export function MatchCard({ match, onSelectWinner, onDraw, onUndo, allowDraw }: Props) {
  const { t } = useTranslation();
  const isReady = match.player1 && match.player2 && !match.winner;
  const isBye =
    match.player1 === "BYE" || match.player2 === "BYE";

  if (isBye && match.winner) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <span className="font-medium">{match.winner}</span>
        <span className="ml-2 text-xs">{t("match.bye")}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        match.winner
          ? "border-border bg-muted/20"
          : isReady
          ? "border-primary/50 bg-card"
          : "border-border bg-muted/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <PlayerButton
          name={match.player1}
          isWinner={match.winner === match.player1}
          isLoser={match.winner !== null && match.winner !== match.player1 && match.winner !== "draw"}
          isDraw={match.winner === "draw"}
          canClick={!!isReady}
          onClick={() =>
            match.player1 && onSelectWinner(match.id, match.player1)
          }
        />
        <span className="text-xs text-muted-foreground font-medium">{t("match.vs")}</span>
        <PlayerButton
          name={match.player2}
          isWinner={match.winner === match.player2}
          isLoser={match.winner !== null && match.winner !== match.player2 && match.winner !== "draw"}
          isDraw={match.winner === "draw"}
          canClick={!!isReady}
          onClick={() =>
            match.player2 && onSelectWinner(match.id, match.player2)
          }
        />
        {/* allowDraw モード（総当り・スイス・とことん）: 引分/取消を同位置に固定 */}
        {allowDraw && (
          isReady ? (
            <button
              onClick={() => onDraw?.(match.id)}
              className="ml-auto text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
            >
              {t("match.draw")}
            </button>
          ) : onUndo && match.winner ? (
            <button
              onClick={() => onUndo(match.id)}
              className="ml-auto text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              {t("match.undo")}
            </button>
          ) : (
            <span className="ml-auto text-xs px-2 py-1 invisible">{t("match.draw")}</span>
          )
        )}
      </div>
      {match.winner && match.winner !== "draw" && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t("match.winner")} <Badge variant="secondary" className="text-xs">{match.winner}</Badge>
          </span>
          {/* ブラケットモード（allowDraw なし）の取消は下段 */}
          {!allowDraw && onUndo && (
            <button
              onClick={() => onUndo(match.id)}
              className="text-xs px-2 py-0.5 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              {t("match.undo")}
            </button>
          )}
        </div>
      )}
      {match.winner === "draw" && (
        <div className="mt-1">
          <Badge variant="outline" className="text-xs">{t("match.drawResult")}</Badge>
        </div>
      )}
    </div>
  );
}

function PlayerButton({
  name,
  isWinner,
  isLoser,
  isDraw,
  canClick,
  onClick,
}: {
  name: string | null;
  isWinner: boolean;
  isLoser: boolean;
  isDraw: boolean;
  canClick: boolean;
  onClick: () => void;
}) {
  if (!name) {
    return (
      <span className="flex-1 text-center text-sm text-muted-foreground/50 py-2">
        ---
      </span>
    );
  }

  return (
    <button
      disabled={!canClick}
      onClick={onClick}
      className={`flex-1 text-center text-sm py-2 px-3 rounded-md transition-all ${
        isWinner
          ? "bg-primary text-primary-foreground font-bold"
          : isLoser
          ? "bg-muted text-muted-foreground line-through opacity-60"
          : isDraw
          ? "bg-muted text-muted-foreground font-medium"
          : canClick
          ? "hover:bg-primary/10 cursor-pointer border border-transparent hover:border-primary/30"
          : "text-muted-foreground"
      }`}
    >
      {name}
    </button>
  );
}
