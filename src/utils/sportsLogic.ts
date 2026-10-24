/**
 * Sports Club Management Pure Logic Utilities
 * Calculation engine for cricket scoreboards, net run rates, tournament standings, and member dues.
 */

/**
 * Converts overs (e.g., 4.3 overs = 4 overs and 3 balls) to total legal balls (4*6 + 3 = 27 balls).
 */
export function oversToBalls(overs: number | string): number {
  const num = typeof overs === 'string' ? parseFloat(overs) : overs;
  if (isNaN(num) || num < 0) return 0;
  const fullOvers = Math.floor(num);
  const remainderBalls = Math.round((num - fullOvers) * 10);
  return fullOvers * 6 + remainderBalls;
}

/**
 * Converts total balls into overs notation (e.g., 27 balls = 4.3 overs).
 */
export function ballsToOvers(balls: number): string {
  if (!balls || balls <= 0) return '0.0';
  const fullOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${fullOvers}.${remainingBalls}`;
}

/**
 * Calculates current Run Rate (Runs scored per over).
 */
export function calculateRunRate(runs: number, totalBalls: number): number {
  if (runs <= 0 || totalBalls <= 0) return 0;
  const overs = totalBalls / 6;
  return Number((runs / overs).toFixed(2));
}

/**
 * Calculates Required Run Rate given a target score and remaining balls.
 */
export function calculateRequiredRunRate(
  target: number,
  currentRuns: number,
  remainingBalls: number
): number | null {
  if (remainingBalls <= 0) return null;
  const neededRuns = target - currentRuns;
  if (neededRuns <= 0) return 0;
  const remainingOvers = remainingBalls / 6;
  return Number((neededRuns / remainingOvers).toFixed(2));
}

/**
 * Calculates batting strike rate: (runs / balls) * 100.
 */
export function calculateBattingStrikeRate(runs: number, balls: number): number {
  if (balls <= 0) return 0;
  return Number(((runs / balls) * 100).toFixed(1));
}

/**
 * Calculates bowling economy rate: runs conceded per over.
 */
export function calculateBowlingEconomy(runsConceded: number, totalBalls: number): number {
  if (totalBalls <= 0) return 0;
  const overs = totalBalls / 6;
  return Number((runsConceded / overs).toFixed(2));
}

export interface MatchResultInput {
  teamA: string;
  teamB: string;
  winner?: string | null;
  tied?: boolean;
  noResult?: boolean;
}

export interface StandingsRow {
  team: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
}

/**
 * Calculates tournament standings for a list of completed matches.
 * Standard points: Win = 2 pts, Tie/No Result = 1 pt, Loss = 0 pts.
 */
export function calculateTournamentStandings(
  teams: string[],
  matches: MatchResultInput[]
): StandingsRow[] {
  const standingsMap: Record<string, StandingsRow> = {};

  teams.forEach((team) => {
    standingsMap[team] = {
      team,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
    };
  });

  matches.forEach((m) => {
    if (!standingsMap[m.teamA] || !standingsMap[m.teamB]) return;
    standingsMap[m.teamA].played += 1;
    standingsMap[m.teamB].played += 1;

    if (m.tied) {
      standingsMap[m.teamA].tied += 1;
      standingsMap[m.teamB].tied += 1;
      standingsMap[m.teamA].points += 1;
      standingsMap[m.teamB].points += 1;
    } else if (m.noResult) {
      standingsMap[m.teamA].noResult += 1;
      standingsMap[m.teamB].noResult += 1;
      standingsMap[m.teamA].points += 1;
      standingsMap[m.teamB].points += 1;
    } else if (m.winner === m.teamA) {
      standingsMap[m.teamA].won += 1;
      standingsMap[m.teamB].lost += 1;
      standingsMap[m.teamA].points += 2;
    } else if (m.winner === m.teamB) {
      standingsMap[m.teamB].won += 1;
      standingsMap[m.teamA].lost += 1;
      standingsMap[m.teamB].points += 2;
    }
  });

  return Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    return a.played - b.played;
  });
}

/**
 * Calculates member arrears or advance dues balance.
 * Positive number = Member owes dues (Arrears).
 * Negative number = Advance payment.
 * Zero = Up to date.
 */
export function calculateMemberArrears(
  totalPaid: number,
  totalWeeksExpected: number,
  weeklyRate: number
): { arrears: number; status: 'PAID' | 'PENDING' | 'OVERDUE' | 'ADVANCE' } {
  const expectedTotal = totalWeeksExpected * weeklyRate;
  const arrears = expectedTotal - totalPaid;

  if (arrears < 0) {
    return { arrears, status: 'ADVANCE' };
  } else if (arrears === 0) {
    return { arrears: 0, status: 'PAID' };
  } else if (arrears <= weeklyRate * 2) {
    return { arrears, status: 'PENDING' };
  } else {
    return { arrears, status: 'OVERDUE' };
  }
}

/**
 * Calculates financial ledger totals (total income, total expense, net balance).
 */
export function calculateLedgerSummary(
  transactions: { category: 'income' | 'expense'; amount: number }[]
): { totalIncome: number; totalExpense: number; netBalance: number } {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.category === 'income') {
      totalIncome += amt;
    } else if (tx.category === 'expense') {
      totalExpense += amt;
    }
  });

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}
