import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BracketView } from "./BracketView";
import { MatchCard } from "./MatchCard";
import { StandingsTable } from "./StandingsTable";
import type { TournamentState } from "@/lib/tournament";
import {
  recordSingleEliminationResult,
  recordDoubleEliminationResult,
  recordRoundRobinResult,
  recordSwissResult,
  recordEndlessResult,
  undoSingleEliminationResult,
  undoDoubleEliminationResult,
  undoRoundRobinResult,
  undoSwissResult,
  undoEndlessResult,
  changeEndlessStations,
  computeEliminationStandings,
} from "@/lib/tournament";

interface Props {
  state: TournamentState;
  onStateChange: (state: TournamentState) => void;
  onReset: () => void;
}

export function TournamentView({ state, onStateChange, onReset }: Props) {
  const { t } = useTranslation();

  const handleWinner = (matchId: string, winner: string) => {
    let newState: TournamentState;
    switch (state.mode) {
      case "single-elimination":
        newState = recordSingleEliminationResult(state, matchId, winner);
        break;
      case "double-elimination":
        newState = recordDoubleEliminationResult(state, matchId, winner);
        break;
      case "round-robin":
        newState = recordRoundRobinResult(state, matchId, winner);
        break;
      case "swiss":
        newState = recordSwissResult(state, matchId, winner);
        break;
      case "endless":
        newState = recordEndlessResult(state, matchId, winner);
        break;
      default:
        return;
    }
    onStateChange(newState);
  };

  const handleDraw = (matchId: string) => {
    let newState: TournamentState;
    switch (state.mode) {
      case "round-robin":
        newState = recordRoundRobinResult(state, matchId, "draw");
        break;
      case "swiss":
        newState = recordSwissResult(state, matchId, "draw");
        break;
      case "endless":
        newState = recordEndlessResult(state, matchId, "draw");
        break;
      default:
        return;
    }
    onStateChange(newState);
  };

  const handleUndo = (matchId: string) => {
    let newState: TournamentState;
    switch (state.mode) {
      case "single-elimination":
        newState = undoSingleEliminationResult(state, matchId);
        break;
      case "double-elimination":
        newState = undoDoubleEliminationResult(state, matchId);
        break;
      case "round-robin":
        newState = undoRoundRobinResult(state, matchId);
        break;
      case "swiss":
        newState = undoSwissResult(state, matchId);
        break;
      case "endless":
        newState = undoEndlessResult(state, matchId);
        break;
      default:
        return;
    }
    onStateChange(newState);
  };

  const allowDraw =
    state.mode === "round-robin" ||
    state.mode === "swiss" ||
    state.mode === "endless";

  const champions: string[] = (() => {
    if (!state.isFinished) return [];
    if (
      state.mode === "single-elimination" ||
      state.mode === "double-elimination"
    ) {
      const finalMatch = [...state.matches]
        .reverse()
        .find((m) => m.winner && m.winner !== "draw");
      return finalMatch?.winner ? [finalMatch.winner] : [];
    }
    if (state.standings.length > 0) {
      const top = state.standings[0];
      return state.standings
        .filter((s) => s.points === top.points && s.wins === top.wins)
        .map((s) => s.name);
    }
    return [];
  })();

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{t(`modes.${state.mode}`)}</h2>
          <Badge variant="outline">{t("tournament.playerCount", { count: state.players.length })}</Badge>
          {state.mode === "swiss" && (
            <Badge variant="secondary">
              {t("tournament.swissRound", { current: state.currentRound, total: state.totalRounds })}
            </Badge>
          )}
          {state.mode === "endless" && (
            <>
              <Badge variant="secondary">
                {t("tournament.matchNumber", { round: state.currentRound })}
              </Badge>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onStateChange(changeEndlessStations(state, (state.stations ?? 1) - 1))}
                  disabled={(state.stations ?? 1) <= 1}
                  className="w-6 h-6 rounded border border-border text-xs hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  −
                </button>
                <Badge variant="outline">
                  {t("tournament.stationCount", { count: state.stations ?? 1 })}
                </Badge>
                <button
                  onClick={() => onStateChange(changeEndlessStations(state, (state.stations ?? 1) + 1))}
                  disabled={(state.stations ?? 1) >= Math.floor(state.players.length / 2)}
                  className="w-6 h-6 rounded border border-border text-xs hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.mode === "endless" && !state.isFinished && (
            <button
              onClick={() => onStateChange({ ...state, lastRound: !state.lastRound })}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                state.lastRound
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {state.lastRound ? t("tournament.endThisMatch") : t("tournament.reserveEnd")}
            </button>
          )}
          <Button variant="outline" onClick={onReset}>
            {t("tournament.reset")}
          </Button>
        </div>
      </div>

      {/* Champion Banner */}
      {state.isFinished && champions.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4 text-center">
            {champions.length === 1 ? (
              <>
                <div className="text-sm text-muted-foreground mb-1">{t("tournament.champion")}</div>
                <div className="text-2xl font-bold">{champions[0]}</div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-1">{t("tournament.tiedFirst")}</div>
                <div className="text-2xl font-bold">{champions.join(", ")}</div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {state.mode === "endless" && !state.isFinished && (
        <Card className="border-muted">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            {t("tournament.endlessHint")}
            <br />
            {t("tournament.endlessHintSub")}
          </CardContent>
        </Card>
      )}

      {/* Bracket modes */}
      {(state.mode === "single-elimination" ||
        state.mode === "double-elimination") && (
        <Card className="flex flex-col">
          <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
            {state.mode === "double-elimination" ? (
              <Tabs defaultValue="winners">
                <TabsList>
                  <TabsTrigger value="winners">{t("tournament.winners")}</TabsTrigger>
                  <TabsTrigger value="losers">{t("tournament.losers")}</TabsTrigger>
                  <TabsTrigger value="grand-final">{t("tournament.grandFinal")}</TabsTrigger>
                </TabsList>
                <TabsContent value="winners">
                  <BracketView
                    matches={state.matches}
                    onSelectWinner={handleWinner}
                    onUndo={handleUndo}
                    bracket="winners"
                  />
                </TabsContent>
                <TabsContent value="losers">
                  <BracketView
                    matches={state.matches}
                    onSelectWinner={handleWinner}
                    onUndo={handleUndo}
                    bracket="losers"
                  />
                </TabsContent>
                <TabsContent value="grand-final">
                  <div className="space-y-2">
                    {state.matches
                      .filter((m) => m.bracket === "grand-final")
                      .map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          onSelectWinner={handleWinner}
                          onUndo={handleUndo}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <BracketView
                matches={state.matches}
                onSelectWinner={handleWinner}
                onUndo={handleUndo}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Elimination standings */}
      {(state.mode === "single-elimination" ||
        state.mode === "double-elimination") &&
        state.matches.some((m) => m.winner && m.player1 !== "BYE" && m.player2 !== "BYE") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("tournament.standings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsTable standings={computeEliminationStandings(state)} />
          </CardContent>
        </Card>
      )}

      {/* Round-based modes */}
      {(state.mode === "round-robin" || state.mode === "swiss") && (
        <>
          {state.standings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("tournament.standings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StandingsTable standings={state.standings} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("tournament.matchTable")}</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const rounds = [
                  ...new Set(state.matches.map((m) => m.round)),
                ].sort((a, b) => a - b);
                return rounds.map((round) => (
                  <div key={round} className="mb-4">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {t("tournament.round", { round })}
                    </div>
                    <div className="space-y-2">
                      {state.matches
                        .filter((m) => m.round === round)
                        .map((m) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                            onSelectWinner={handleWinner}
                            onDraw={handleDraw}
                            onUndo={handleUndo}
                            allowDraw={allowDraw}
                          />
                        ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </>
      )}

      {/* Endless mode */}
      {state.mode === "endless" && (
        <>
          {state.standings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("tournament.standings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StandingsTable standings={state.standings} />
              </CardContent>
            </Card>
          )}

          {state.matches.some((m) => !m.winner) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">{t("tournament.inProgress")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.matches.filter((m) => !m.winner).map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">
                        #{m.round}
                      </span>
                      <div className="flex-1">
                        <MatchCard
                          match={m}
                          onSelectWinner={handleWinner}
                          onDraw={handleDraw}
                          onUndo={handleUndo}
                          allowDraw={allowDraw}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {state.matches.some((m) => m.winner) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("tournament.matchHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...state.matches].filter((m) => m.winner).reverse().map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">
                        #{m.round}
                      </span>
                      <div className="flex-1">
                        <MatchCard
                          match={m}
                          onSelectWinner={handleWinner}
                          onDraw={handleDraw}
                          onUndo={handleUndo}
                          allowDraw={allowDraw}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
