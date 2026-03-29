import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PlayerInput } from "@/components/PlayerInput";
import { TournamentView } from "@/components/TournamentView";
import { PolicyModal } from "@/components/PolicyModal";
import type { TournamentMode, TournamentState, ScoringRule } from "@/lib/tournament";
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateRoundRobin,
  generateSwiss,
  generateEndless,
} from "@/lib/tournament";

function App() {
  const { t, i18n } = useTranslation();
  const [tournament, setTournament] = useState<TournamentState | null>(null);

  useEffect(() => {
    document.documentElement.lang = i18n.language.startsWith("ja") ? "ja" : "en";
  }, [i18n.language]);

  const handleGenerate = (
    players: string[],
    mode: TournamentMode,
    doShuffle: boolean,
    swissRounds?: number,
    stations?: number,
    scoring?: ScoringRule
  ) => {
    let state: TournamentState;
    switch (mode) {
      case "single-elimination":
        state = generateSingleElimination(players, doShuffle);
        break;
      case "double-elimination":
        state = generateDoubleElimination(players, doShuffle);
        break;
      case "round-robin":
        state = generateRoundRobin(players, doShuffle);
        break;
      case "swiss":
        state = generateSwiss(players, doShuffle, swissRounds);
        break;
      case "endless":
        state = generateEndless(players, doShuffle, stations);
        break;
    }
    if (scoring) state = { ...state, scoring };
    setTournament(state);
  };

  return (
    <div className={`bg-background ${tournament ? "h-screen flex flex-col" : "min-h-screen"}`}>
      <div className={`mx-auto ${tournament ? "px-6 py-4 max-w-screen-2xl w-full flex flex-col flex-1 min-h-0" : "px-4 py-8 max-w-4xl"}`}>
        <header className={`text-center ${tournament ? "mb-4" : "mb-8"}`}>
          <h1 className="text-3xl font-bold tracking-tight">{t("app.title")}</h1>
          <p className="text-muted-foreground/40 text-xs tracking-wide mt-0.5">Test + Tournament</p>
          <p className="text-muted-foreground text-sm mt-1">
            {t("app.subtitle")}
          </p>
        </header>

        {tournament ? (
          <div className="flex-1 min-h-0 overflow-auto">
            <TournamentView
              state={tournament}
              onStateChange={setTournament}
              onReset={() => setTournament(null)}
            />
          </div>
        ) : (
          <PlayerInput onGenerate={handleGenerate} />
        )}
        {tournament && <PolicyModal compact />}
      </div>
      {!tournament && <PolicyModal />}
    </div>
  );
}

export default App;
