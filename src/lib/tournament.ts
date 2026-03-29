// === 共通型定義 ===

export type TournamentMode =
  | "single-elimination"
  | "double-elimination"
  | "round-robin"
  | "swiss"
  | "endless";

export interface Match {
  id: string;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  loser: string | null;
  /** ダブルエリミ用: "winners" | "losers" | "grand-final" */
  bracket?: string;
}

export interface Standing {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  matchesPlayed: number;
  /** スイス式用: 対戦相手の勝ち数合計(タイブレーカー) */
  buchholz?: number;
}

export interface TournamentState {
  mode: TournamentMode;
  players: string[];
  matches: Match[];
  currentRound: number;
  standings: Standing[];
  isFinished: boolean;
  /** スイス式: 総ラウンド数 */
  totalRounds?: number;
  /** とことん対戦: 対戦台数 */
  stations?: number;
  /** とことん対戦: 現在の試合で終了フラグ */
  lastRound?: boolean;
}

// === ユーティリティ ===

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createStandings(players: string[]): Standing[] {
  return players.map((name) => ({
    name,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    matchesPlayed: 0,
  }));
}

let matchIdCounter = 0;
function nextMatchId(): string {
  return `m${++matchIdCounter}`;
}

export function resetMatchIdCounter() {
  matchIdCounter = 0;
}

// === エリミネーション順位計算 ===

export function computeEliminationStandings(state: TournamentState): Standing[] {
  const playerStats = new Map<string, { wins: number; losses: number; eliminatedInRound: number }>();

  for (const p of state.players) {
    playerStats.set(p, { wins: 0, losses: 0, eliminatedInRound: 0 });
  }

  const maxRound = Math.max(...state.matches.map((m) => m.round));

  for (const m of state.matches) {
    if (!m.winner || m.winner === "draw") continue;
    if (m.player1 === "BYE" || m.player2 === "BYE") continue;

    const winnerStats = playerStats.get(m.winner);
    if (winnerStats) winnerStats.wins++;

    if (m.loser && m.loser !== "BYE") {
      const loserStats = playerStats.get(m.loser);
      if (loserStats) {
        loserStats.losses++;
        if (loserStats.eliminatedInRound < m.round) {
          loserStats.eliminatedInRound = m.round;
        }
      }
    }
  }

  // 優勝者は最高ラウンド+1
  if (state.isFinished) {
    const finalMatch = [...state.matches]
      .reverse()
      .find((m) => m.winner && m.winner !== "draw");
    if (finalMatch?.winner) {
      const champStats = playerStats.get(finalMatch.winner);
      if (champStats) champStats.eliminatedInRound = maxRound + 1;
    }
  } else {
    // 進行中: まだ負けていない選手は現在のラウンド+1
    for (const [, stats] of playerStats) {
      if (stats.losses === 0 && stats.wins > 0) {
        stats.eliminatedInRound = maxRound + 1;
      }
    }
  }

  const standings: Standing[] = [];
  for (const [name, stats] of playerStats) {
    standings.push({
      name,
      wins: stats.wins,
      losses: stats.losses,
      draws: 0,
      points: stats.wins * 3,
      matchesPlayed: stats.wins + stats.losses,
    });
  }

  standings.sort((a, b) => {
    const aElim = playerStats.get(a.name)!.eliminatedInRound;
    const bElim = playerStats.get(b.name)!.eliminatedInRound;
    if (bElim !== aElim) return bElim - aElim;
    return b.wins - a.wins;
  });

  return standings;
}

// === シングルエリミネーション ===

export function generateSingleElimination(
  players: string[],
  doShuffle: boolean
): TournamentState {
  resetMatchIdCounter();
  const list = doShuffle ? shuffle(players) : [...players];

  // 2のべき乗に足りない分はBYE
  const size = Math.pow(2, Math.ceil(Math.log2(list.length)));
  while (list.length < size) list.push("BYE");

  const matches: Match[] = [];
  const totalRounds = Math.log2(size);

  // 1回戦
  for (let i = 0; i < size; i += 2) {
    const m: Match = {
      id: nextMatchId(),
      round: 1,
      player1: list[i],
      player2: list[i + 1],
      winner: null,
      loser: null,
    };
    // BYE自動処理
    if (m.player2 === "BYE") {
      m.winner = m.player1;
      m.loser = "BYE";
    } else if (m.player1 === "BYE") {
      m.winner = m.player2;
      m.loser = "BYE";
    }
    matches.push(m);
  }

  // 2回戦以降の空枠
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = size / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: nextMatchId(),
        round,
        player1: null,
        player2: null,
        winner: null,
        loser: null,
      });
    }
  }

  // BYE勝者を次のラウンドに自動進出
  propagateWinners(matches, totalRounds);

  return {
    mode: "single-elimination",
    players: list.filter((p) => p !== "BYE"),
    matches,
    currentRound: 1,
    standings: [],
    isFinished: false,
  };
}

function propagateWinners(matches: Match[], totalRounds: number) {
  for (let round = 1; round < totalRounds; round++) {
    const currentRoundMatches = matches.filter((m) => m.round === round);
    const nextRoundMatches = matches.filter((m) => m.round === round + 1);

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const m = currentRoundMatches[i];
      if (m.winner) {
        const nextMatch = nextRoundMatches[Math.floor(i / 2)];
        if (nextMatch) {
          if (i % 2 === 0) nextMatch.player1 = m.winner;
          else nextMatch.player2 = m.winner;

          // 次の試合もBYE処理
          if (
            nextMatch.player1 &&
            nextMatch.player2 &&
            (nextMatch.player1 === "BYE" || nextMatch.player2 === "BYE")
          ) {
            nextMatch.winner =
              nextMatch.player1 === "BYE"
                ? nextMatch.player2
                : nextMatch.player1;
            nextMatch.loser = "BYE";
          }
        }
      }
    }
  }
}

export function recordSingleEliminationResult(
  state: TournamentState,
  matchId: string,
  winnerName: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || match.winner) return state;

  match.winner = winnerName;
  match.loser =
    match.player1 === winnerName ? match.player2 : match.player1;

  // 次ラウンドへ進出
  const maxRound = Math.max(...matches.map((m) => m.round));
  if (match.round < maxRound) {
    const currentRoundMatches = matches.filter(
      (m) => m.round === match.round
    );
    const nextRoundMatches = matches.filter(
      (m) => m.round === match.round + 1
    );
    const idx = currentRoundMatches.indexOf(match);
    const nextMatch = nextRoundMatches[Math.floor(idx / 2)];
    if (nextMatch) {
      if (idx % 2 === 0) nextMatch.player1 = winnerName;
      else nextMatch.player2 = winnerName;
    }
  }

  const isFinished =
    match.round === maxRound ||
    matches.every((m) => m.winner !== null);

  return { ...state, matches, isFinished };
}

export function undoSingleEliminationResult(
  state: TournamentState,
  matchId: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || !match.winner) return state;

  // BYE試合は取消不可
  if (match.player1 === "BYE" || match.player2 === "BYE") return state;

  const maxRound = Math.max(...matches.map((m) => m.round));

  // この試合以降に依存する試合を全てリセット（再帰的）
  clearDownstream(matches, match, maxRound);

  match.winner = null;
  match.loser = null;

  return { ...state, matches, isFinished: false };
}

function clearDownstream(matches: Match[], match: Match, maxRound: number) {
  if (match.round >= maxRound) return;

  const currentRoundMatches = matches.filter((m) => m.round === match.round && m.bracket === match.bracket);
  const nextRoundMatches = matches.filter((m) => m.round === match.round + 1 && m.bracket === match.bracket);
  const idx = currentRoundMatches.indexOf(match);
  const nextMatch = nextRoundMatches[Math.floor(idx / 2)];

  if (nextMatch) {
    // まず更に下流を再帰的にクリア
    if (nextMatch.winner) {
      clearDownstream(matches, nextMatch, maxRound);
      nextMatch.winner = null;
      nextMatch.loser = null;
    }
    // この試合の勝者が入っていたスロットをクリア
    if (idx % 2 === 0) nextMatch.player1 = null;
    else nextMatch.player2 = null;
  }
}

// === ダブルエリミネーション ===
//
// 構造（8人の例、winnersRounds=3）:
//   Winners: WR1(4試合) → WR2(2試合) → WR3=WF(1試合)
//   Losers:  LR1(2試合, WR1敗者同士) → LR2(2試合, LR1勝者 vs WR2敗者)
//            → LR3(1試合, LR2勝者同士) → LR4(1試合, LR3勝者 vs WF敗者)
//   Grand Final: Winners優勝 vs Losers優勝
//
// Losersラウンド数 = (winnersRounds - 1) * 2
// 奇数LR: 前ラウンドの勝者同士（人数半減）
// 偶数LR: 前ラウンドの勝者 vs Winnersからの落下者（人数維持）

export function generateDoubleElimination(
  players: string[],
  doShuffle: boolean
): TournamentState {
  resetMatchIdCounter();
  const list = doShuffle ? shuffle(players) : [...players];
  const size = Math.pow(2, Math.ceil(Math.log2(list.length)));
  while (list.length < size) list.push("BYE");

  const matches: Match[] = [];
  const winnersRounds = Math.log2(size);

  // --- Winners bracket ---
  for (let i = 0; i < size; i += 2) {
    const m: Match = {
      id: nextMatchId(),
      round: 1,
      player1: list[i],
      player2: list[i + 1],
      winner: null,
      loser: null,
      bracket: "winners",
    };
    if (m.player2 === "BYE") {
      m.winner = m.player1;
      m.loser = "BYE";
    } else if (m.player1 === "BYE") {
      m.winner = m.player2;
      m.loser = "BYE";
    }
    matches.push(m);
  }
  for (let round = 2; round <= winnersRounds; round++) {
    const count = size / Math.pow(2, round);
    for (let i = 0; i < count; i++) {
      matches.push({
        id: nextMatchId(),
        round,
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        bracket: "winners",
      });
    }
  }

  // BYE自動進出（winners内）
  propagateWinnersBracket(matches, winnersRounds);

  // --- Losers bracket ---
  // 奇数LR: 内部戦（勝者同士で半減）
  // 偶数LR: ドロップダウン戦（Winners落下者と対戦、人数維持）
  const totalLosersRounds = (winnersRounds - 1) * 2;
  let prevSurvivors = size / 2; // WR1の敗者数 = LR1に入る人数

  for (let lr = 1; lr <= totalLosersRounds; lr++) {
    const isOdd = lr % 2 === 1;
    let matchCount: number;
    if (isOdd) {
      // 奇数LR: 勝者同士で対戦（人数半減）
      matchCount = prevSurvivors / 2;
      prevSurvivors = matchCount; // 生存者数が半減
    } else {
      // 偶数LR: 前ラウンドの勝者 vs Winners落下者（人数維持）
      matchCount = prevSurvivors;
      // prevSurvivors変わらず
    }
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: nextMatchId(),
        round: lr,
        player1: null,
        player2: null,
        winner: null,
        loser: null,
        bracket: "losers",
      });
    }
  }

  // BYE敗者をLR1に送り込む
  sendByeLosersToLosers(matches);

  // --- Grand Final ---
  matches.push({
    id: nextMatchId(),
    round: 1,
    player1: null,
    player2: null,
    winner: null,
    loser: null,
    bracket: "grand-final",
  });

  return {
    mode: "double-elimination",
    players: list.filter((p) => p !== "BYE"),
    matches,
    currentRound: 1,
    standings: [],
    isFinished: false,
  };
}

function propagateWinnersBracket(matches: Match[], winnersRounds: number) {
  for (let round = 1; round < winnersRounds; round++) {
    const current = matches.filter(
      (m) => m.bracket === "winners" && m.round === round
    );
    const next = matches.filter(
      (m) => m.bracket === "winners" && m.round === round + 1
    );
    for (let i = 0; i < current.length; i++) {
      if (current[i].winner) {
        const nm = next[Math.floor(i / 2)];
        if (nm) {
          if (i % 2 === 0) nm.player1 = current[i].winner;
          else nm.player2 = current[i].winner;
          // 次の試合もBYE処理
          if (nm.player1 && nm.player2) {
            if (nm.player1 === "BYE") {
              nm.winner = nm.player2;
              nm.loser = "BYE";
            } else if (nm.player2 === "BYE") {
              nm.winner = nm.player1;
              nm.loser = "BYE";
            }
          }
        }
      }
    }
  }
}

function sendByeLosersToLosers(matches: Match[]) {
  // WR1のBYE試合の敗者のみをLR1に送り込む
  // WR1で実際のプレイヤー同士の試合の敗者はrecordDoubleEliminationResultで送る
  const wr1 = matches.filter(
    (m) => m.bracket === "winners" && m.round === 1
  );
  const lr1 = matches.filter(
    (m) => m.bracket === "losers" && m.round === 1
  );

  for (let i = 0; i < wr1.length; i += 2) {
    const lm = lr1[i / 2];
    if (!lm) continue;

    // BYE試合（不戦勝）のみ処理
    const m1 = wr1[i];
    const m2 = wr1[i + 1];
    const isBye1 = m1.player1 === "BYE" || m1.player2 === "BYE";
    const isBye2 = m2 && (m2.player1 === "BYE" || m2.player2 === "BYE");

    // BYE試合の敗者はBYEそのもの → LR1には入れない
    // 両方BYE試合の場合、LR1のこのスロットは両方空で不戦勝にもならない
    // → 両方とも実際の敗者が出ないので、BYE不戦勝マーク
    if (isBye1 && isBye2) {
      lm.player1 = "BYE";
      lm.player2 = "BYE";
      lm.winner = "BYE";
      lm.loser = "BYE";
    }
    // 片方だけBYE試合の場合、実際の試合の敗者がいずれ入る → 空のまま待機
  }
}

export function recordDoubleEliminationResult(
  state: TournamentState,
  matchId: string,
  winnerName: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || match.winner) return state;

  match.winner = winnerName;
  match.loser =
    match.player1 === winnerName ? match.player2 : match.player1;

  const winnersRounds = Math.log2(
    Math.pow(
      2,
      Math.ceil(Math.log2(state.players.length))
    )
  );

  if (match.bracket === "winners") {
    const winnersInRound = matches.filter(
      (m) => m.bracket === "winners" && m.round === match.round
    );
    const nextWinners = matches.filter(
      (m) => m.bracket === "winners" && m.round === match.round + 1
    );
    const idx = winnersInRound.indexOf(match);

    // 勝者 → Winners次ラウンドへ
    if (nextWinners.length > 0) {
      const next = nextWinners[Math.floor(idx / 2)];
      if (next) {
        if (idx % 2 === 0) next.player1 = winnerName;
        else next.player2 = winnerName;
      }
    } else {
      // Winners Final → Grand Final player1
      const gf = matches.find((m) => m.bracket === "grand-final");
      if (gf) gf.player1 = winnerName;
    }

    // 敗者 → Losers bracketへ
    if (match.loser && match.loser !== "BYE") {
      sendLoserToLosers(matches, match);
    }
  } else if (match.bracket === "losers") {
    const losersInRound = matches.filter(
      (m) => m.bracket === "losers" && m.round === match.round
    );
    const idx = losersInRound.indexOf(match);
    const isOddRound = match.round % 2 === 1;
    const totalLR = (winnersRounds - 1) * 2;

    if (match.round < totalLR) {
      const nextLosers = matches.filter(
        (m) => m.bracket === "losers" && m.round === match.round + 1
      );
      if (isOddRound) {
        // 奇数→偶数: 1:1で次のplayer1へ（人数維持）
        const nm = nextLosers[idx];
        if (nm) nm.player1 = winnerName;
      } else {
        // 偶数→奇数: 勝者同士がペアになる（半減）
        const nm = nextLosers[Math.floor(idx / 2)];
        if (nm) {
          if (idx % 2 === 0) nm.player1 = winnerName;
          else nm.player2 = winnerName;
        }
      }
    } else {
      // Losers Final → Grand Final player2
      const gf = matches.find((m) => m.bracket === "grand-final");
      if (gf) gf.player2 = winnerName;
    }
  } else if (match.bracket === "grand-final") {
    // 完了
  }

  const gf = matches.find((m) => m.bracket === "grand-final");
  const isFinished = !!(gf?.winner);

  return { ...state, matches, isFinished };
}

/**
 * Winners bracketの敗者をLosers bracketの適切なラウンドに送り込む
 *
 * WR(n)の敗者 → LR(n*2 - 2) に入る（player2として）
 * ただしWR1の敗者はLR1に入る（生成時に処理済み。ここではWR2以降を扱う）
 */
function sendLoserToLosers(
  matches: Match[],
  winnersMatch: Match,
) {
  const wr = winnersMatch.round;

  if (wr === 1) {
    // WR1敗者 → LR1に配置（ペアで管理）
    const wr1 = matches.filter(
      (m) => m.bracket === "winners" && m.round === 1
    );
    const lr1 = matches.filter(
      (m) => m.bracket === "losers" && m.round === 1
    );
    const idx = wr1.indexOf(winnersMatch);
    const lm = lr1[Math.floor(idx / 2)];
    if (!lm) return;

    if (idx % 2 === 0) lm.player1 = winnersMatch.loser;
    else lm.player2 = winnersMatch.loser;
    return;
  }

  // WR(n) → LR(2*(n-1)) にplayer2として入る
  const targetLR = 2 * (wr - 1);
  const losersTarget = matches.filter(
    (m) => m.bracket === "losers" && m.round === targetLR
  );
  const winnersInRound = matches.filter(
    (m) => m.bracket === "winners" && m.round === wr
  );
  const idx = winnersInRound.indexOf(winnersMatch);

  if (losersTarget[idx]) {
    losersTarget[idx].player2 = winnersMatch.loser;
  }
}

export function undoDoubleEliminationResult(
  state: TournamentState,
  matchId: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || !match.winner) return state;
  if (match.player1 === "BYE" || match.player2 === "BYE") return state;

  const winnersRounds = Math.log2(
    Math.pow(2, Math.ceil(Math.log2(state.players.length)))
  );

  if (match.bracket === "winners") {
    // 勝者の下流（winners内）をクリア
    clearWinnersDownstream(matches, match, winnersRounds);
    // 敗者がlosersに入っている場合、そちらもクリア
    clearLoserFromLosers(matches, match, winnersRounds);
  } else if (match.bracket === "losers") {
    clearLosersDownstream(matches, match, winnersRounds);
  } else if (match.bracket === "grand-final") {
    // just clear
  }

  match.winner = null;
  match.loser = null;

  return { ...state, matches, isFinished: false };
}

function clearWinnersDownstream(
  matches: Match[],
  match: Match,
  winnersRounds: number
) {
  const winnersInRound = matches.filter(
    (m) => m.bracket === "winners" && m.round === match.round
  );
  const nextWinners = matches.filter(
    (m) => m.bracket === "winners" && m.round === match.round + 1
  );
  const idx = winnersInRound.indexOf(match);

  if (nextWinners.length > 0) {
    const next = nextWinners[Math.floor(idx / 2)];
    if (next) {
      if (next.winner) {
        clearWinnersDownstream(matches, next, winnersRounds);
        // nextの敗者がlosersにいる場合もクリア
        clearLoserFromLosers(matches, next, winnersRounds);
        next.winner = null;
        next.loser = null;
      }
      if (idx % 2 === 0) next.player1 = null;
      else next.player2 = null;
    }
  } else {
    // Winners Final → Grand Final
    const gf = matches.find((m) => m.bracket === "grand-final");
    if (gf) {
      gf.player1 = null;
      gf.winner = null;
      gf.loser = null;
    }
  }
}

function clearLoserFromLosers(
  matches: Match[],
  winnersMatch: Match,
  winnersRounds: number
) {
  const wr = winnersMatch.round;
  if (wr === 1) {
    // WR1敗者はLR1に入っている
    const winnersInRound = matches.filter(
      (m) => m.bracket === "winners" && m.round === 1
    );
    const idx = winnersInRound.indexOf(winnersMatch);
    const lr1 = matches.filter(
      (m) => m.bracket === "losers" && m.round === 1
    );
    const lm = lr1[Math.floor(idx / 2)];
    if (lm) {
      // この試合以降を再帰的にクリア
      if (lm.winner) {
        clearLosersDownstream(matches, lm, winnersRounds);
        lm.winner = null;
        lm.loser = null;
      }
      if (idx % 2 === 0) lm.player1 = null;
      else lm.player2 = null;
    }
  } else {
    const targetLR = 2 * (wr - 1);
    const losersTarget = matches.filter(
      (m) => m.bracket === "losers" && m.round === targetLR
    );
    const winnersInRound = matches.filter(
      (m) => m.bracket === "winners" && m.round === wr
    );
    const idx = winnersInRound.indexOf(winnersMatch);
    const lm = losersTarget[idx];
    if (lm) {
      if (lm.winner) {
        clearLosersDownstream(matches, lm, winnersRounds);
        lm.winner = null;
        lm.loser = null;
      }
      lm.player2 = null;
    }
  }
}

function clearLosersDownstream(
  matches: Match[],
  match: Match,
  winnersRounds: number
) {
  const losersInRound = matches.filter(
    (m) => m.bracket === "losers" && m.round === match.round
  );
  const idx = losersInRound.indexOf(match);
  const isOddRound = match.round % 2 === 1;
  const totalLR = (winnersRounds - 1) * 2;

  if (match.round < totalLR) {
    const nextLosers = matches.filter(
      (m) => m.bracket === "losers" && m.round === match.round + 1
    );
    let nm: Match | undefined;
    let slot: "player1" | "player2";

    if (isOddRound) {
      // 奇数→偶数: 1:1
      nm = nextLosers[idx];
      slot = "player1";
    } else {
      // 偶数→奇数: 半減
      nm = nextLosers[Math.floor(idx / 2)];
      slot = idx % 2 === 0 ? "player1" : "player2";
    }

    if (nm) {
      if (nm.winner) {
        clearLosersDownstream(matches, nm, winnersRounds);
        nm.winner = null;
        nm.loser = null;
      }
      nm[slot] = null;
    }
  } else {
    // Losers Final → Grand Final
    const gf = matches.find((m) => m.bracket === "grand-final");
    if (gf) {
      gf.player2 = null;
      gf.winner = null;
      gf.loser = null;
    }
  }
}

// === ラウンドロビン（総当り） ===

export function generateRoundRobin(
  players: string[],
  doShuffle: boolean
): TournamentState {
  resetMatchIdCounter();
  const list = doShuffle ? shuffle(players) : [...players];

  // 奇数なら BYE を追加
  const withBye = list.length % 2 !== 0 ? [...list, "BYE"] : [...list];
  const n = withBye.length;
  const totalRounds = n - 1;
  const matches: Match[] = [];

  // サークル法でラウンドロビンスケジュール生成
  const fixed = withBye[0];
  const rotating = withBye.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const current = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      const p1 = current[i];
      const p2 = current[n - 1 - i];
      if (p1 === "BYE" || p2 === "BYE") continue;
      matches.push({
        id: nextMatchId(),
        round: round + 1,
        player1: p1,
        player2: p2,
        winner: null,
        loser: null,
      });
    }
    // ローテーション
    rotating.push(rotating.shift()!);
  }

  return {
    mode: "round-robin",
    players: list,
    matches,
    currentRound: 1,
    standings: createStandings(list),
    isFinished: false,
  };
}

export function recordRoundRobinResult(
  state: TournamentState,
  matchId: string,
  winnerName: string | "draw"
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const standings = state.standings.map((s) => ({ ...s }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || match.winner) return state;

  if (winnerName === "draw") {
    match.winner = "draw";
    match.loser = "draw";
    const s1 = standings.find((s) => s.name === match.player1)!;
    const s2 = standings.find((s) => s.name === match.player2)!;
    s1.draws++;
    s1.points += 1;
    s1.matchesPlayed++;
    s2.draws++;
    s2.points += 1;
    s2.matchesPlayed++;
  } else {
    match.winner = winnerName;
    match.loser =
      match.player1 === winnerName ? match.player2 : match.player1;
    const winner = standings.find((s) => s.name === winnerName)!;
    const loser = standings.find((s) => s.name === match.loser)!;
    winner.wins++;
    winner.points += 3;
    winner.matchesPlayed++;
    loser.losses++;
    loser.matchesPlayed++;
  }

  // ソート: points desc, wins desc
  standings.sort((a, b) => b.points - a.points || b.wins - a.wins);

  const isFinished = matches.every((m) => m.winner !== null);

  return { ...state, matches, standings, isFinished };
}

function recalcStandings(players: string[], matches: Match[]): Standing[] {
  const standings = createStandings(players);
  for (const m of matches) {
    if (!m.winner) continue;
    if (m.winner === "draw") {
      const s1 = standings.find((s) => s.name === m.player1);
      const s2 = standings.find((s) => s.name === m.player2);
      if (s1) { s1.draws++; s1.points += 1; s1.matchesPlayed++; }
      if (s2) { s2.draws++; s2.points += 1; s2.matchesPlayed++; }
    } else if (m.winner !== "BYE") {
      const winner = standings.find((s) => s.name === m.winner);
      const loser = standings.find((s) => s.name === m.loser);
      if (winner) { winner.wins++; winner.points += 3; winner.matchesPlayed++; }
      if (loser && loser.name !== "BYE") { loser.losses++; loser.matchesPlayed++; }
    }
  }
  standings.sort((a, b) => b.points - a.points || b.wins - a.wins);
  return standings;
}

export function undoRoundRobinResult(
  state: TournamentState,
  matchId: string
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || !match.winner) return state;

  match.winner = null;
  match.loser = null;

  const standings = recalcStandings(state.players, matches);
  return { ...state, matches, standings, isFinished: false };
}

export function undoSwissResult(
  state: TournamentState,
  matchId: string
): TournamentState {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match || !match.winner) return state;

  // 取り消す試合のラウンド以降の試合を全て削除（次ラウンドが自動生成されていた場合）
  const matches = state.matches
    .map((m) => ({ ...m }))
    .filter((m) => m.round <= match.round);

  const target = matches.find((m) => m.id === matchId)!;
  target.winner = null;
  target.loser = null;

  const standings = recalcStandings(state.players, matches);
  const currentRound = match.round;

  return { ...state, matches, standings, currentRound, isFinished: false };
}

export function changeEndlessStations(
  state: TournamentState,
  newStations: number
): TournamentState {
  const stations = Math.max(1, newStations);
  let matches = state.matches.map((m) => ({ ...m }));
  const pendingCount = matches.filter((m) => !m.winner).length;

  if (pendingCount < stations && !state.lastRound) {
    // 台数増加: 試合を補充（終了フラグ時は補充しない）
    for (let i = pendingCount; i < stations; i++) {
      const before = matches.length;
      matches = generateNextEndlessMatch(state.players, matches);
      if (matches.length === before) break;
    }
  } else if (pendingCount > stations) {
    // 台数減少: 余分な未決着試合を末尾から削除
    let toRemove = pendingCount - stations;
    for (let i = matches.length - 1; i >= 0 && toRemove > 0; i--) {
      if (!matches[i].winner) {
        matches.splice(i, 1);
        toRemove--;
      }
    }
  }

  return { ...state, matches, stations };
}

export function undoEndlessResult(
  state: TournamentState,
  matchId: string
): TournamentState {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match || !match.winner) return state;

  // この試合以降を全て削除し、この試合の結果をクリア
  const matches = state.matches
    .map((m) => ({ ...m }))
    .filter((m) => m.round <= match.round);

  const target = matches.find((m) => m.id === matchId)!;
  target.winner = null;
  target.loser = null;

  const standings = recalcStandings(state.players, matches);
  const currentRound = match.round;

  return { ...state, matches, standings, currentRound };
}

// === スイス式 ===

export function generateSwiss(
  players: string[],
  doShuffle: boolean,
  totalRounds?: number
): TournamentState {
  resetMatchIdCounter();
  const list = doShuffle ? shuffle(players) : [...players];
  const rounds =
    totalRounds || Math.ceil(Math.log2(list.length));

  // 1ラウンド目を生成
  const matches = generateSwissRound(list, [], 1);

  return {
    mode: "swiss",
    players: list,
    matches,
    currentRound: 1,
    standings: createStandings(list),
    isFinished: false,
    totalRounds: rounds,
  };
}

function generateSwissRound(
  players: string[],
  previousMatches: Match[],
  round: number
): Match[] {
  const matches: Match[] = [...previousMatches];
  const paired = new Set<string>();
  const roundMatches: Match[] = [];

  // 過去の対戦ペアを記録
  const playedPairs = new Set<string>();
  for (const m of previousMatches) {
    if (m.player1 && m.player2) {
      playedPairs.add(`${m.player1}:${m.player2}`);
      playedPairs.add(`${m.player2}:${m.player1}`);
    }
  }

  // 成績順にソート
  const standings = new Map<string, number>();
  for (const p of players) standings.set(p, 0);
  for (const m of previousMatches) {
    if (m.winner && m.winner !== "draw" && m.winner !== "BYE") {
      standings.set(m.winner, (standings.get(m.winner) || 0) + 3);
    }
    if (m.winner === "draw") {
      if (m.player1)
        standings.set(m.player1, (standings.get(m.player1) || 0) + 1);
      if (m.player2)
        standings.set(m.player2, (standings.get(m.player2) || 0) + 1);
    }
  }

  const sorted = [...players].sort(
    (a, b) => (standings.get(b) || 0) - (standings.get(a) || 0)
  );

  for (const p of sorted) {
    if (paired.has(p)) continue;
    for (const q of sorted) {
      if (q === p || paired.has(q)) continue;
      if (playedPairs.has(`${p}:${q}`)) continue;
      paired.add(p);
      paired.add(q);
      roundMatches.push({
        id: nextMatchId(),
        round,
        player1: p,
        player2: q,
        winner: null,
        loser: null,
      });
      break;
    }
  }

  // 奇数で余った人はBYE（不戦勝）
  for (const p of sorted) {
    if (!paired.has(p)) {
      roundMatches.push({
        id: nextMatchId(),
        round,
        player1: p,
        player2: "BYE",
        winner: p,
        loser: "BYE",
      });
    }
  }

  return [...matches, ...roundMatches];
}

export function recordSwissResult(
  state: TournamentState,
  matchId: string,
  winnerName: string | "draw"
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const standings = state.standings.map((s) => ({ ...s }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || match.winner) return state;

  if (winnerName === "draw") {
    match.winner = "draw";
    match.loser = "draw";
    const s1 = standings.find((s) => s.name === match.player1)!;
    const s2 = standings.find((s) => s.name === match.player2)!;
    s1.draws++;
    s1.points += 1;
    s1.matchesPlayed++;
    s2.draws++;
    s2.points += 1;
    s2.matchesPlayed++;
  } else {
    match.winner = winnerName;
    match.loser =
      match.player1 === winnerName ? match.player2 : match.player1;
    const winner = standings.find((s) => s.name === winnerName)!;
    const loser = standings.find((s) => s.name === match.loser)!;
    winner.wins++;
    winner.points += 3;
    winner.matchesPlayed++;
    loser.losses++;
    loser.matchesPlayed++;
  }

  standings.sort((a, b) => b.points - a.points || b.wins - a.wins);

  // このラウンドが全部終わったか
  const roundMatches = matches.filter(
    (m) => m.round === state.currentRound
  );
  const allDone = roundMatches.every((m) => m.winner !== null);

  if (allDone && state.currentRound < (state.totalRounds || 0)) {
    // 次ラウンド生成
    const newMatches = generateSwissRound(
      state.players,
      matches,
      state.currentRound + 1
    );
    return {
      ...state,
      matches: newMatches,
      standings,
      currentRound: state.currentRound + 1,
      isFinished: false,
    };
  }

  const isFinished =
    allDone && state.currentRound >= (state.totalRounds || 0);

  return { ...state, matches, standings, isFinished };
}

// === とことん対戦 ===

export function generateEndless(
  players: string[],
  doShuffle: boolean,
  stations: number = 1
): TournamentState {
  resetMatchIdCounter();
  const list = doShuffle ? shuffle(players) : [...players];
  const standings = createStandings(list);

  // 台数分の初回試合を生成
  let matches: Match[] = [];
  for (let i = 0; i < stations; i++) {
    matches = generateNextEndlessMatch(list, matches);
  }

  return {
    mode: "endless",
    players: list,
    matches,
    currentRound: 1,
    standings,
    isFinished: false,
    stations,
  };
}

function generateNextEndlessMatch(
  players: string[],
  existingMatches: Match[]
): Match[] {
  const matches = [...existingMatches];

  // 進行中の試合に出ているプレイヤーを除外
  const busyPlayers = new Set<string>();
  for (const m of matches) {
    if (!m.winner) {
      if (m.player1) busyPlayers.add(m.player1);
      if (m.player2) busyPlayers.add(m.player2);
    }
  }

  const available = players.filter((p) => !busyPlayers.has(p));
  if (available.length < 2) return matches;

  // 各プレイヤーの最終出場ラウンドと試合数を計算
  const lastPlayed = new Map<string, number>();
  const matchCount = new Map<string, number>();
  for (const p of players) {
    lastPlayed.set(p, 0);
    matchCount.set(p, 0);
  }
  for (const m of matches) {
    if (m.player1 && m.player1 !== "BYE") {
      lastPlayed.set(
        m.player1,
        Math.max(lastPlayed.get(m.player1) || 0, m.round)
      );
      matchCount.set(m.player1, (matchCount.get(m.player1) || 0) + 1);
    }
    if (m.player2 && m.player2 !== "BYE") {
      lastPlayed.set(
        m.player2,
        Math.max(lastPlayed.get(m.player2) || 0, m.round)
      );
      matchCount.set(m.player2, (matchCount.get(m.player2) || 0) + 1);
    }
  }

  const nextRound =
    matches.length > 0
      ? Math.max(...matches.map((m) => m.round)) + 1
      : 1;

  // スコアリング: 試合数が少ないほど＋最後の出場が古いほど優先（空きプレイヤーのみ）
  const scored = available
    .map((p) => ({
      name: p,
      count: matchCount.get(p) || 0,
      last: lastPlayed.get(p) || 0,
    }))
    .sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.last - b.last;
    });

  // 対戦ペア履歴を見て、なるべく同じ対戦を避ける
  const pairCount = new Map<string, number>();
  for (const m of matches) {
    if (m.player1 && m.player2) {
      const key = [m.player1, m.player2].sort().join(":");
      pairCount.set(key, (pairCount.get(key) || 0) + 1);
    }
  }

  const p1 = scored[0].name;
  let bestOpponent = scored[1].name;
  let bestScore = Infinity;

  for (let i = 1; i < scored.length; i++) {
    const p2 = scored[i].name;
    const pairKey = [p1, p2].sort().join(":");
    const pairFreq = pairCount.get(pairKey) || 0;
    const consecutivePenalty = scored[i].last === nextRound - 1 ? 10 : 0;
    const score = pairFreq * 100 + scored[i].count + consecutivePenalty;
    if (score < bestScore) {
      bestScore = score;
      bestOpponent = p2;
    }
  }

  matches.push({
    id: nextMatchId(),
    round: nextRound,
    player1: p1,
    player2: bestOpponent,
    winner: null,
    loser: null,
  });

  return matches;
}

export function recordEndlessResult(
  state: TournamentState,
  matchId: string,
  winnerName: string | "draw"
): TournamentState {
  const matches = state.matches.map((m) => ({ ...m }));
  const standings = state.standings.map((s) => ({ ...s }));
  const match = matches.find((m) => m.id === matchId);
  if (!match || match.winner) return state;

  if (winnerName === "draw") {
    match.winner = "draw";
    match.loser = "draw";
    const s1 = standings.find((s) => s.name === match.player1)!;
    const s2 = standings.find((s) => s.name === match.player2)!;
    s1.draws++;
    s1.points += 1;
    s1.matchesPlayed++;
    s2.draws++;
    s2.points += 1;
    s2.matchesPlayed++;
  } else {
    match.winner = winnerName;
    match.loser =
      match.player1 === winnerName ? match.player2 : match.player1;
    const winner = standings.find((s) => s.name === winnerName)!;
    const loser = standings.find((s) => s.name === match.loser)!;
    winner.wins++;
    winner.points += 3;
    winner.matchesPlayed++;
    loser.losses++;
    loser.matchesPlayed++;
  }

  standings.sort((a, b) => b.points - a.points || b.wins - a.wins);

  let newMatches = matches;
  let isFinished = false;

  if (state.lastRound) {
    // 終了フラグON: 補充しない。全試合消化で終了
    isFinished = newMatches.every((m) => m.winner);
  } else {
    // 空き台数分の次の試合を補充
    const stations = state.stations || 1;
    const pendingCount = newMatches.filter((m) => !m.winner).length;
    for (let i = pendingCount; i < stations; i++) {
      const before = newMatches.length;
      newMatches = generateNextEndlessMatch(state.players, newMatches);
      if (newMatches.length === before) break;
    }
  }

  return {
    ...state,
    matches: newMatches,
    standings,
    currentRound: state.currentRound + 1,
    isFinished,
  };
}
