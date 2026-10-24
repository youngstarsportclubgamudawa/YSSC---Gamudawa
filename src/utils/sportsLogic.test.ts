import test from 'node:test';
import assert from 'node:assert/strict';
import {
  oversToBalls,
  ballsToOvers,
  calculateRunRate,
  calculateRequiredRunRate,
  calculateBattingStrikeRate,
  calculateBowlingEconomy,
  calculateTournamentStandings,
  calculateMemberArrears,
  calculateLedgerSummary,
} from './sportsLogic';

test('oversToBalls converts cricket overs to legal delivery count', () => {
  assert.equal(oversToBalls('4.3'), 27);
  assert.equal(oversToBalls(4.3), 27);
  assert.equal(oversToBalls(20), 120);
  assert.equal(oversToBalls('0.1'), 1);
  assert.equal(oversToBalls('0.0'), 0);
  assert.equal(oversToBalls(-1), 0);
});

test('ballsToOvers converts total balls into over.ball notation', () => {
  assert.equal(ballsToOvers(27), '4.3');
  assert.equal(ballsToOvers(120), '20.0');
  assert.equal(ballsToOvers(5), '0.5');
  assert.equal(ballsToOvers(0), '0.0');
});

test('calculateRunRate computes run rate per over correctly', () => {
  // 60 runs in 60 balls (10 overs) = 6.00
  assert.equal(calculateRunRate(60, 60), 6);
  // 150 runs in 120 balls (20 overs) = 7.50
  assert.equal(calculateRunRate(150, 120), 7.5);
  // 0 runs or 0 balls
  assert.equal(calculateRunRate(0, 30), 0);
  assert.equal(calculateRunRate(45, 0), 0);
});

test('calculateRequiredRunRate computes target deficit per remaining over', () => {
  // Target 180, current 120 (need 60), 30 balls remaining (5 overs) -> 60 / 5 = 12.00
  assert.equal(calculateRequiredRunRate(180, 120, 30), 12);
  // Target already achieved: need 0
  assert.equal(calculateRequiredRunRate(100, 105, 12), 0);
  // No balls remaining
  assert.equal(calculateRequiredRunRate(150, 140, 0), null);
});

test('calculateBattingStrikeRate & calculateBowlingEconomy', () => {
  // 75 runs off 50 balls = 150.0 SR
  assert.equal(calculateBattingStrikeRate(75, 50), 150);
  assert.equal(calculateBattingStrikeRate(0, 10), 0);

  // 24 runs in 24 balls (4 overs) = 6.00 economy
  assert.equal(calculateBowlingEconomy(24, 24), 6);
  // 36 runs in 30 balls (5 overs) = 7.20 economy
  assert.equal(calculateBowlingEconomy(36, 30), 7.2);
});

test('calculateTournamentStandings aggregates wins, ties, and points correctly', () => {
  const teams = ['Gamudawa Lions', 'Gamudawa Tigers', 'Lake View CC'];
  const matches = [
    { teamA: 'Gamudawa Lions', teamB: 'Gamudawa Tigers', winner: 'Gamudawa Lions' },
    { teamA: 'Gamudawa Tigers', teamB: 'Lake View CC', tied: true },
    { teamA: 'Gamudawa Lions', teamB: 'Lake View CC', winner: 'Gamudawa Lions' },
  ];

  const standings = calculateTournamentStandings(teams, matches);

  // Gamudawa Lions should be 1st with 2 wins (4 pts)
  assert.equal(standings[0].team, 'Gamudawa Lions');
  assert.equal(standings[0].won, 2);
  assert.equal(standings[0].points, 4);

  // Gamudawa Tigers and Lake View tied one match each (1 pt each)
  const tigers = standings.find((s) => s.team === 'Gamudawa Tigers');
  assert.equal(tigers?.points, 1);
  assert.equal(tigers?.tied, 1);
  assert.equal(tigers?.lost, 1);
});

test('calculateMemberArrears determines paid, pending, and overdue states', () => {
  const weeklyRate = 100; // LKR 100 / week
  const weeksExpected = 10; // Total LKR 1000 expected

  // Paid full 1000
  const paidResult = calculateMemberArrears(1000, weeksExpected, weeklyRate);
  assert.equal(paidResult.status, 'PAID');
  assert.equal(paidResult.arrears, 0);

  // Advance paid 1200
  const advanceResult = calculateMemberArrears(1200, weeksExpected, weeklyRate);
  assert.equal(advanceResult.status, 'ADVANCE');
  assert.equal(advanceResult.arrears, -200);

  // Minor delay of 1 week (LKR 100 pending)
  const pendingResult = calculateMemberArrears(900, weeksExpected, weeklyRate);
  assert.equal(pendingResult.status, 'PENDING');
  assert.equal(pendingResult.arrears, 100);

  // Major delay of 5 weeks (LKR 500 arrears)
  const overdueResult = calculateMemberArrears(500, weeksExpected, weeklyRate);
  assert.equal(overdueResult.status, 'OVERDUE');
  assert.equal(overdueResult.arrears, 500);
});

test('calculateLedgerSummary tallies income, expenses and net balance', () => {
  const txs = [
    { category: 'income' as const, amount: 5000 },
    { category: 'income' as const, amount: 2500 },
    { category: 'expense' as const, amount: 1800 },
    { category: 'expense' as const, amount: 700 },
  ];

  const summary = calculateLedgerSummary(txs);
  assert.equal(summary.totalIncome, 7500);
  assert.equal(summary.totalExpense, 2500);
  assert.equal(summary.netBalance, 5000);
});
