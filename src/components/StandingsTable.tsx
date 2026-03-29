import { useTranslation } from "react-i18next";
import type { Standing } from "@/lib/tournament";

interface Props {
  standings: Standing[];
}

export function StandingsTable({ standings }: Props) {
  const { t } = useTranslation();

  if (standings.length === 0) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left py-2 px-3 font-medium">#</th>
            <th className="text-left py-2 px-3 font-medium">{t("standings.name")}</th>
            <th className="text-center py-2 px-3 font-medium">{t("standings.wins")}</th>
            <th className="text-center py-2 px-3 font-medium">{t("standings.losses")}</th>
            <th className="text-center py-2 px-3 font-medium">{t("standings.draws")}</th>
            <th className="text-center py-2 px-3 font-medium">{t("standings.matches")}</th>
            <th className="text-center py-2 px-3 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.name}
              className={`border-t border-border ${
                i === 0 ? "bg-primary/5" : ""
              }`}
            >
              <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
              <td className="py-2 px-3 font-medium">{s.name}</td>
              <td className="text-center py-2 px-3">{s.wins}</td>
              <td className="text-center py-2 px-3">{s.losses}</td>
              <td className="text-center py-2 px-3">{s.draws}</td>
              <td className="text-center py-2 px-3">{s.matchesPlayed}</td>
              <td className="text-center py-2 px-3 font-bold">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
