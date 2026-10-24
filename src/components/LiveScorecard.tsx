import React, { useState } from 'react';
import { MatchScorecard } from '../types';
import { calculateRunRate, calculateRequiredRunRate, calculateBattingStrikeRate, calculateBowlingEconomy, ballsToOvers } from '../utils/sportsLogic';
import { Share2, PlusCircle, RotateCcw, Award, MapPin, Clock, ArrowRightLeft, Radio } from 'lucide-react';

interface LiveScorecardProps {
  matches: MatchScorecard[];
  onUpdateMatch: (updated: MatchScorecard) => void;
  lang: 'en' | 'si';
}

export const LiveScorecard: React.FC<LiveScorecardProps> = ({ matches, onUpdateMatch, lang }) => {
  const liveMatches = matches.filter((m) => m.status === 'live');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    liveMatches[0]?.id || matches[0]?.id
  );

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];
  const liveData = activeMatch?.liveData;

  // Custom run input for scoring control
  const [scorerNotes, setScorerNotes] = useState('');

  if (!activeMatch) {
    return (
      <div className="p-8 text-center text-slate-500">
        No matches available.
      </div>
    );
  }

  const currentBalls = liveData?.totalBalls || 0;
  const currentRuns = liveData?.runs || 0;
  const currentWickets = liveData?.wickets || 0;
  const target = liveData?.target;

  const crr = calculateRunRate(currentRuns, currentBalls);
  const remainingBalls = target ? Math.max(0, 120 - currentBalls) : 0; // assuming T20
  const rrr = target ? calculateRequiredRunRate(target, currentRuns, remainingBalls) : null;
  const runsNeeded = target ? target - currentRuns : 0;

  // Handler for adding a delivery
  const handleScoreDelivery = (result: string, runs: number, isWicket = false, isExtra = false) => {
    if (!liveData) return;

    const newRuns = currentRuns + runs;
    const newWickets = isWicket ? Math.min(10, currentWickets + 1) : currentWickets;
    // legal ball increment
    const isLegalBall = !isExtra;
    const newTotalBalls = isLegalBall ? currentBalls + 1 : currentBalls;

    // Over ball notation
    const overNumber = Math.floor(newTotalBalls / 6);
    const ballInOver = newTotalBalls % 6;
    const ballNotation = `${overNumber}.${ballInOver}`;

    // Update striker / bowler stats
    const updatedStriker = { ...liveData.striker };
    const updatedBowler = { ...liveData.bowler };

    if (!isExtra) {
      updatedStriker.balls += 1;
      updatedStriker.runs += runs;
      if (runs === 4) updatedStriker.fours += 1;
      if (runs === 6) updatedStriker.sixes += 1;
    }

    updatedBowler.runs += runs;
    if (isWicket) updatedBowler.wickets += 1;
    updatedBowler.oversConceded = ballsToOvers(newTotalBalls);

    // Current over balls list (reset if over completes)
    let newCurrentOverBalls = [...liveData.currentOverBalls, result];
    if (isLegalBall && ballInOver === 0 && newCurrentOverBalls.length >= 6) {
      newCurrentOverBalls = [];
    }

    // Commentary text
    let commentary = scorerNotes;
    if (!commentary) {
      if (isWicket) commentary = `WICKET! ${liveData.striker.name} departs!`;
      else if (runs === 6) commentary = `MASSIVE SIX! Driven cleanly over the ropes!`;
      else if (runs === 4) commentary = `CRACKING FOUR! Beautiful timing through the field!`;
      else if (runs === 0) commentary = `No run. Bowled on a good length.`;
      else commentary = `${runs} run${runs > 1 ? 's' : ''} scored.`;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newBallEvent = {
      ball: ballNotation,
      result,
      runs,
      isWicket,
      commentary,
      timestamp: timeStr,
    };

    // Auto rotate strike on odd runs
    let finalStriker = updatedStriker;
    let finalNonStriker = { ...liveData.nonStriker };
    if (runs % 2 === 1 && !isWicket) {
      finalStriker = liveData.nonStriker;
      finalNonStriker = updatedStriker;
    }

    const updatedMatch: MatchScorecard = {
      ...activeMatch,
      teamA: {
        ...activeMatch.teamA,
        runs: newRuns,
        wickets: newWickets,
        overs: ballsToOvers(newTotalBalls),
      },
      liveData: {
        ...liveData,
        runs: newRuns,
        wickets: newWickets,
        totalBalls: newTotalBalls,
        currentOverBalls: newCurrentOverBalls,
        striker: finalStriker,
        nonStriker: finalNonStriker,
        bowler: updatedBowler,
        recentBallEvents: [newBallEvent, ...liveData.recentBallEvents].slice(0, 20),
      },
    };

    onUpdateMatch(updatedMatch);
    setScorerNotes('');
  };

  const handleRotateStrike = () => {
    if (!liveData) return;
    const temp = liveData.striker;
    onUpdateMatch({
      ...activeMatch,
      liveData: {
        ...liveData,
        striker: liveData.nonStriker,
        nonStriker: temp,
      },
    });
  };

  const handleShareToWhatsApp = () => {
    const text = encodeURIComponent(
      `🏏 *LIVE SCORECARD · YOUNG STAR SC GAMUDAWA*\n` +
      `🏆 ${activeMatch.tournamentName}\n` +
      `📍 ${activeMatch.venue}\n\n` +
      `*${activeMatch.teamA.name}*: ${currentRuns}/${currentWickets} (${ballsToOvers(currentBalls)} ov)\n` +
      (target ? `*${activeMatch.teamB.name}*: ${activeMatch.teamB.runs}/${activeMatch.teamB.wickets} (Target: ${target})\n` : '') +
      `*Batting*: ${liveData?.striker.name} ${liveData?.striker.runs}* (${liveData?.striker.balls}) | ${liveData?.nonStriker.name} ${liveData?.nonStriker.runs}* (${liveData?.nonStriker.balls})\n` +
      (target && runsNeeded > 0 ? `*Equation*: Need ${runsNeeded} runs from ${remainingBalls} balls (RRR: ${rrr})\n` : '') +
      `\nView live match center: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Match Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            {lang === 'si' ? 'තරඟ තෝරන්න:' : 'Select Match:'}
          </span>
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMatchId(m.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition flex items-center gap-1.5 ${
                selectedMatchId === m.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {m.status === 'live' && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              )}
              <span>{m.teamA.shortName} vs {m.teamB.shortName}</span>
              <span className="text-[10px] text-slate-500">({m.sport})</span>
            </button>
          ))}
        </div>

        {/* WhatsApp Share Match Summary */}
        <button
          onClick={handleShareToWhatsApp}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{lang === 'si' ? 'වට්ස්ඇප් වෙත යවන්න' : 'Share Score to WhatsApp'}</span>
        </button>
      </div>

      {/* Main Match Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {/* Top Status & Venue Strip */}
        <div className="bg-slate-950/70 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            {activeMatch.status === 'live' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 animate-pulse">
                <Radio className="w-3 h-3" />
                LIVE INNINGS
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                {activeMatch.status}
              </span>
            )}
            <span className="text-amber-400 font-semibold">{activeMatch.tournamentName}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              {activeMatch.venue}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {activeMatch.time}
            </span>
          </div>
        </div>

        {/* Center Teams Scoreboard Display */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Team A (Young Star SC - Batting) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight flex items-center gap-2">
                    {activeMatch.teamA.name}
                    {activeMatch.currentBattingTeam === 'teamA' && (
                      <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        BATTING
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'si' ? 'පළමු පෙළ ක්‍රිකට් කණ්ඩායම' : 'Premier Cricket Division'}
                  </p>
                </div>
              </div>

              {activeMatch.status === 'live' ? (
                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-5xl sm:text-6xl font-black tracking-tighter text-white">
                    {currentRuns}/{currentWickets}
                  </span>
                  <div className="text-sm font-semibold text-slate-300">
                    <div>{ballsToOvers(currentBalls)} Overs</div>
                    <div className="text-xs text-amber-300">CRR: {crr}</div>
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-white pt-2">
                  {activeMatch.teamA.runs ?? '--'} / {activeMatch.teamA.wickets ?? '--'}
                  <span className="text-sm text-slate-400 font-normal ml-2">
                    ({activeMatch.teamA.overs ?? '--'} ov)
                  </span>
                </div>
              )}
            </div>

            {/* Team B (Opposition) */}
            <div className="space-y-2 md:border-l md:border-slate-700 md:pl-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight">
                    {activeMatch.teamB.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {target ? `Innings 1 Total: ${activeMatch.teamB.runs}/${activeMatch.teamB.wickets}` : 'Opposition XI'}
                  </p>
                </div>
              </div>

              {target ? (
                <div className="pt-2">
                  <div className="text-sm text-slate-300 font-medium">
                    Target: <span className="text-amber-400 font-bold text-lg">{target}</span> runs
                  </div>
                  {activeMatch.status === 'live' && runsNeeded > 0 ? (
                    <div className="text-sm text-emerald-400 font-semibold mt-1">
                      Need <span className="font-bold text-white">{runsNeeded}</span> runs in{' '}
                      <span className="font-bold text-white">{remainingBalls}</span> balls
                      {rrr && <span className="ml-2 text-xs text-slate-300">(RRR: {rrr})</span>}
                    </div>
                  ) : activeMatch.status === 'live' && runsNeeded <= 0 ? (
                    <div className="text-emerald-400 font-bold text-base mt-1">
                      🎉 Young Star SC Won the match!
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-slate-400 pt-2">
                  {activeMatch.resultSummary || 'Awaiting match progression'}
                </div>
              )}
            </div>
          </div>

          {/* Current Over Deliveries Strip */}
          {liveData && (
            <div className="mt-6 pt-5 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  This Over:
                </span>
                <div className="flex items-center gap-1.5">
                  {liveData.currentOverBalls.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">Starting new over...</span>
                  ) : (
                    liveData.currentOverBalls.map((b, i) => (
                      <span
                        key={i}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          b === 'W'
                            ? 'bg-red-600 text-white'
                            : b === '6'
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : b === '4'
                            ? 'bg-blue-600 text-white'
                            : b === '0'
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-slate-800 text-white border border-slate-600'
                        }`}
                      >
                        {b}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {activeMatch.manOfTheMatch && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>PoTM: {activeMatch.manOfTheMatch}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batsmen & Bowlers Card if Live Cricket */}
      {liveData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batsmen Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Batter Statistics</span>
              </h4>
              <button
                onClick={handleRotateStrike}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                title="Swap Strike Batter"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Switch Strike</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-medium">
                    <th className="pb-2">Batter</th>
                    <th className="pb-2 text-right">R</th>
                    <th className="pb-2 text-right">B</th>
                    <th className="pb-2 text-right">4s</th>
                    <th className="pb-2 text-right">6s</th>
                    <th className="pb-2 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-amber-50/50">
                    <td className="py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{liveData.striker.name}</span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-200/80 px-1.5 py-0.2 rounded">
                        STRIKE
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-slate-900 text-sm">
                      {liveData.striker.runs}
                    </td>
                    <td className="py-2.5 text-right text-slate-600">{liveData.striker.balls}</td>
                    <td className="py-2.5 text-right text-slate-600">{liveData.striker.fours}</td>
                    <td className="py-2.5 text-right text-slate-600">{liveData.striker.sixes}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {calculateBattingStrikeRate(liveData.striker.runs, liveData.striker.balls)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-slate-800">
                      {liveData.nonStriker.name}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {liveData.nonStriker.runs}
                    </td>
                    <td className="py-2.5 text-right text-slate-600">{liveData.nonStriker.balls}</td>
                    <td className="py-2.5 text-right text-slate-600">{liveData.nonStriker.fours}</td>
                    <td className="py-2.5 text-right text-slate-600">{liveData.nonStriker.sixes}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {calculateBattingStrikeRate(liveData.nonStriker.runs, liveData.nonStriker.balls)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bowler Details */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Current Bowler
              </div>
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <span className="font-bold text-slate-900">{liveData.bowler.name}</span>
                <div className="flex items-center gap-4 text-slate-600">
                  <span>Overs: <strong className="text-slate-900">{liveData.bowler.oversConceded}</strong></span>
                  <span>Maidens: <strong className="text-slate-900">{liveData.bowler.maidens}</strong></span>
                  <span>Runs: <strong className="text-slate-900">{liveData.bowler.runs}</strong></span>
                  <span>Wkts: <strong className="text-slate-900">{liveData.bowler.wickets}</strong></span>
                  <span>Econ: <strong className="text-slate-900">{calculateBowlingEconomy(liveData.bowler.runs, currentBalls)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Match Scorer Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-500" />
                <span>Match Scorer Console</span>
              </h4>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Official Access
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Record live delivery outcomes. Stats and calculations auto-sync across all screens.
            </p>

            {/* Scoring Buttons Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleScoreDelivery('0', 0)}
                className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition active:scale-95"
              >
                0 (Dot)
              </button>
              <button
                onClick={() => handleScoreDelivery('1', 1)}
                className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition active:scale-95"
              >
                1 Single
              </button>
              <button
                onClick={() => handleScoreDelivery('2', 2)}
                className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition active:scale-95"
              >
                2 Runs
              </button>
              <button
                onClick={() => handleScoreDelivery('3', 3)}
                className="py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition active:scale-95"
              >
                3 Runs
              </button>
              <button
                onClick={() => handleScoreDelivery('4', 4)}
                className="py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition active:scale-95"
              >
                4 (Four)
              </button>
              <button
                onClick={() => handleScoreDelivery('6', 6)}
                className="py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition active:scale-95"
              >
                6 (Six)
              </button>
              <button
                onClick={() => handleScoreDelivery('W', 0, true)}
                className="py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm transition active:scale-95 col-span-1"
              >
                Wicket (W)
              </button>
              <button
                onClick={() => handleScoreDelivery('Wd', 1, false, true)}
                className="py-2.5 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition active:scale-95"
              >
                +1 Wide
              </button>
              <button
                onClick={() => handleScoreDelivery('Nb', 1, false, true)}
                className="py-2.5 text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition active:scale-95"
              >
                +1 No Ball
              </button>
            </div>

            {/* Quick commentary note */}
            <div>
              <input
                type="text"
                value={scorerNotes}
                onChange={(e) => setScorerNotes(e.target.value)}
                placeholder="Optional ball commentary note..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Ball-by-ball Commentary Feed */}
      {liveData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              {lang === 'si' ? 'සජීවී විස්තර ප්‍රවාහය (Ball by Ball Commentary)' : 'Live Ball by Ball Commentary'}
            </h4>
            <span className="text-xs text-slate-500">
              {liveData.recentBallEvents.length} Recent Deliveries
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {liveData.recentBallEvents.map((event, idx) => (
              <div key={idx} className="py-3 flex items-start gap-3">
                <span
                  className={`w-9 h-7 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                    event.isWicket
                      ? 'bg-red-600 text-white'
                      : event.runs === 6
                      ? 'bg-amber-400 text-slate-950'
                      : event.runs === 4
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {event.result}
                </span>

                <div className="flex-1 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Over {event.ball}</span>
                    <span className="text-[10px] text-slate-400">{event.timestamp}</span>
                  </div>
                  <p className="text-slate-600">{event.commentary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
