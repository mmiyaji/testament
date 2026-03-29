import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeIcon } from "@/components/ModeIcons";
import type { TournamentMode, ScoringRule } from "@/lib/tournament";

const MODE_KEYS: TournamentMode[] = [
  "single-elimination",
  "double-elimination",
  "round-robin",
  "swiss",
  "endless",
];

function getSampleNames(t: ReturnType<typeof useTranslation>["t"]) {
  return Array.from({ length: 16 }, (_, i) => t("samples.player", { n: i + 1 }));
}

const SCORING_RULES: { value: ScoringRule; key: string }[] = [
  { value: "3-1-0", key: "310" },
  { value: "2-1-0", key: "210" },
  { value: "1-0.5-0", key: "1050" },
  { value: "1-0-0", key: "100" },
];

interface Props {
  onGenerate: (
    players: string[],
    mode: TournamentMode,
    shuffle: boolean,
    swissRounds?: number,
    stations?: number,
    scoring?: ScoringRule
  ) => void;
}

export function PlayerInput({ onGenerate }: Props) {
  const { t } = useTranslation();
  const sampleNames = getSampleNames(t);

  const [text, setText] = useState(sampleNames.slice(0, 8).join("\n"));
  const [mode, setMode] = useState<TournamentMode>("single-elimination");
  const [doShuffle, setDoShuffle] = useState(true);
  const [swissRounds, setSwissRounds] = useState(0);
  const [stations, setStations] = useState(1);
  const [scoring, setScoring] = useState<ScoringRule>("3-1-0");

  const allowScoring = mode === "round-robin" || mode === "swiss" || mode === "endless";

  const players = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // 同名プレイヤーに [1], [2]... を付与（重複がある名前のみ）
  const deduplicatedPlayers = (() => {
    const freq = new Map<string, number>();
    for (const name of players) freq.set(name, (freq.get(name) || 0) + 1);
    const counts = new Map<string, number>();
    return players.map((name) => {
      const count = (counts.get(name) || 0) + 1;
      counts.set(name, count);
      return freq.get(name)! > 1 ? `${name} [${count}]` : name;
    });
  })();

  const handleGenerate = () => {
    if (players.length < 2) return;
    onGenerate(deduplicatedPlayers, mode, doShuffle, swissRounds || undefined, mode === "endless" ? stations : undefined, allowScoring ? scoring : undefined);
  };

  const handleSampleAdd = () => {
    const current = text.split("\n").map((s) => s.trim()).filter(Boolean);
    const next = sampleNames.find((n) => !current.includes(n));
    if (next) {
      setText(current.length > 0 ? text.trimEnd() + "\n" + next : next);
    }
  };

  const handleSampleRemove = () => {
    const lines = text.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        lines.splice(i, 1);
        break;
      }
    }
    setText(lines.join("\n"));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("input.enterPlayers")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("input.playerCount", { count: players.length })}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleSampleRemove} disabled={players.length === 0}>
                {t("input.remove")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSampleAdd}>
                {t("input.add")}
              </Button>
            </div>
          </div>
          <Textarea
            placeholder={t("input.placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("input.mode")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MODE_KEYS.map((key) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                mode === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={key}
                checked={mode === key}
                onChange={() => setMode(key)}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t(`modes.${key}`)}</div>
                <div className="text-xs text-muted-foreground">{t(`modes.${key}-desc`)}</div>
              </div>
              <ModeIcon mode={key} />
            </label>
          ))}

          {mode === "swiss" && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm">{t("input.swissRounds")}</label>
              <input
                type="number"
                min={1}
                max={20}
                value={swissRounds || Math.ceil(Math.log2(Math.max(players.length, 2)))}
                onChange={(e) => setSwissRounds(parseInt(e.target.value) || 0)}
                className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
          )}

          {mode === "endless" && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm">{t("input.stations")}</label>
              <input
                type="number"
                min={1}
                max={Math.floor(players.length / 2) || 1}
                value={stations}
                onChange={(e) => setStations(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setDoShuffle((v) => !v)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              doShuffle
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border"
            }`}
          >
            <span>{doShuffle ? t("input.shuffleOn") : t("input.shuffleOff")}</span>
          </button>
          {allowScoring && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("scoring.label")}:</span>
              <select
                value={scoring}
                onChange={(e) => setScoring(e.target.value as ScoringRule)}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              >
                {SCORING_RULES.map((r) => (
                  <option key={r.value} value={r.value}>{t(`scoring.${r.key}`)}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <button
        onClick={handleGenerate}
        disabled={players.length < 2}
        className={`w-full h-14 text-[17px] font-medium rounded-lg border-none flex items-center justify-center transition-opacity ${
          players.length < 2
            ? "opacity-40 cursor-not-allowed bg-primary text-primary-foreground"
            : "cursor-pointer bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {t("input.generate")}
      </button>
    </div>
  );
}
