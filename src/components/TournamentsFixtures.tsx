import React, { useState } from 'react';
import { MatchScorecard, SportType } from '../types';
import { calculateTournamentStandings } from '../utils/sportsLogic';
import { Calendar, MapPin, Clock, Trophy, Plus, CheckCircle, Radio } from 'lucide-react';

interface TournamentsFixturesProps {
  matches: MatchScorecard[];
  onAddMatch: (match: MatchScorecard) => void;
  onSelectLiveMatch: (matchId: string) => void;
  lang: 'en' | 'si';
}

export const TournamentsFixtures: React.FC<TournamentsFixturesProps> = ({
  matches,
  onAddMatch,
  onSelectLiveMatch,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings'>('fixtures');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // New Match Schedule Form
  const [form, setForm] = useState({
    title: '',
    tournamentName: 'Gamudawa Premier Champions Trophy 2026',
    sport: 'Cricket' as SportType,
    date: new Date().toISOString().split('T')[0],
    time: '03:00 PM',
    venue: 'Gamudawa Mahinda Rajapaksa Ground',
    teamAName: 'Young Star SC',
    teamAShort: 'YSSC',
    teamBName: '',
    teamBShort: '',
    matchType: 'T20 (20 Overs)',
  });

  const filteredMatches = matches.filter((m) => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesSport = sportFilter === 'All' || m.sport === sportFilter;
    return matchesStatus && matchesSport;
  });

  // Calculate standings for completed cricket tournament matches
  const tournamentTeams = [
    'Young Star SC',
    'Minneriya Royal Challengers',
    'Dambulla United CC',
    'Polonnaruwa Blue Birds',
  ];

  const matchResultsForStandings = [
    { teamA: 'Young Star SC', teamB: 'Dambulla United CC', winner: 'Young Star SC' },
    { teamA: 'Minneriya Royal Challengers', teamB: 'Polonnaruwa Blue Birds', winner: 'Minneriya Royal Challengers' },
    { teamA: 'Young Star SC', teamB: 'Polonnaruwa Blue Birds', winner: 'Young Star SC' },
    { teamA: 'Dambulla United CC', teamB: 'Minneriya Royal Challengers', tied: true },
  ];

  const standings = calculateTournamentStandings(tournamentTeams, matchResultsForStandings);

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamBName.trim() || !form.title.trim()) return;

    const newMatch: MatchScorecard = {
      id: `match-${Date.now()}`,
      title: form.title,
      tournamentName: form.tournamentName,
      sport: form.sport,
      date: form.date,
      time: form.time,
      venue: form.venue,
      status: 'upcoming',
      matchType: form.matchType,
      teamA: {
        id: 'team-yssc',
        name: form.teamAName,
        shortName: form.teamAShort,
      },
      teamB: {
        id: `team-${Date.now()}`,
        name: form.teamBName,
        shortName: form.teamBShort || form.teamBName.substring(0, 4).toUpperCase(),
      },
    };

    onAddMatch(newMatch);
    setIsScheduleOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'si' ? 'තරඟාවලි කාලසටහන සහ ප්‍රසාද ලකුණු සටහන' : 'Tournaments & Fixtures'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'si'
              ? 'ගම්උදාව ක්‍රිකට් සහ වොලිබෝල් ශූරතාවලියන්ගේ තරඟ ප්‍රතිඵල'
              : 'Match schedule, live fixtures, and tournament points table'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'fixtures'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fixtures & Results
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'standings'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Points Table
            </button>
          </div>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Match</span>
          </button>
        </div>
      </div>

      {activeTab === 'fixtures' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Status pills */}
            <div className="flex items-center gap-1.5">
              {(['all', 'live', 'upcoming', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-amber-400 font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'live' ? '🔴 Live Now' : st}
                </button>
              ))}
            </div>

            {/* Sport select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Sport:</span>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              >
                <option value="All">All Sports</option>
                <option value="Cricket">Cricket</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Football">Football</option>
                <option value="Carrom">Carrom</option>
              </select>
            </div>
          </div>

          {/* Fixture Cards List */}
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    {match.status === 'live' ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold animate-pulse">
                        <Radio className="w-3 h-3" />
                        LIVE NOW
                      </span>
                    ) : match.status === 'completed' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                        <CheckCircle className="w-3 h-3" />
                        COMPLETED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                        UPCOMING
                      </span>
                    )}

                    <span className="font-bold text-slate-700">{match.tournamentName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-medium">{match.matchType}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {match.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {match.time}
                    </span>
                  </div>
                </div>

                {/* Match Opponents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
                  {/* Team A */}
                  <div className="sm:col-span-5 flex items-center justify-between sm:justify-end gap-3 text-right">
                    <div className="sm:text-right">
                      <h4 className="text-base font-black text-slate-900">{match.teamA.name}</h4>
                      <p className="text-xs text-amber-600 font-semibold">{match.teamA.shortName}</p>
                    </div>
                    {match.teamA.runs !== undefined && (
                      <div className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                        {match.teamA.runs}/{match.teamA.wickets ?? 0}
                      </div>
                    )}
                  </div>

                  {/* VS Emblem */}
                  <div className="sm:col-span-1 text-center font-black text-xs text-slate-400">
                    VS
                  </div>

                  {/* Team B */}
                  <div className="sm:col-span-5 flex items-center justify-between sm:justify-start gap-3 text-left">
                    {match.teamB.runs !== undefined && (
                      <div className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                        {match.teamB.runs}/{match.teamB.wickets ?? 0}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-black text-slate-900">{match.teamB.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{match.teamB.shortName}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{match.venue}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {match.resultSummary && (
                      <span className="font-semibold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg">
                        {match.resultSummary}
                      </span>
                    )}

                    {match.status === 'live' && (
                      <button
                        onClick={() => onSelectLiveMatch(match.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm transition"
                      >
                        Open Live Scorer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standings Table Tab */}
      {activeTab === 'standings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Gamudawa Premier Champions Trophy 2026</span>
              </h3>
              <p className="text-xs text-slate-500">Official tournament league standings table</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Standard ICC Points (2-1-0)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Pos</th>
                  <th className="pb-3">Team</th>
                  <th className="pb-3 text-center">P</th>
                  <th className="pb-3 text-center">W</th>
                  <th className="pb-3 text-center">L</th>
                  <th className="pb-3 text-center">T/NR</th>
                  <th className="pb-3 text-right font-black">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standings.map((row, index) => {
                  const isYssc = row.team === 'Young Star SC';
                  return (
                    <tr key={row.team} className={isYssc ? 'bg-amber-50/60 font-bold' : ''}>
                      <td className="py-3.5 font-bold text-slate-500">{index + 1}</td>
                      <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        {isYssc && <span className="text-amber-500">⭐</span>}
                        <span>{row.team}</span>
                      </td>
                      <td className="py-3.5 text-center text-slate-700">{row.played}</td>
                      <td className="py-3.5 text-center text-emerald-600 font-semibold">{row.won}</td>
                      <td className="py-3.5 text-center text-red-600">{row.lost}</td>
                      <td className="py-3.5 text-center text-slate-500">{row.tied + row.noResult}</td>
                      <td className="py-3.5 text-right font-black text-slate-900 text-sm">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Match Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Schedule New Fixture</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Match Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. League Round 5 Derby"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tournament</label>
                <input
                  type="text"
                  value={form.tournamentName}
                  onChange={(e) => setForm({ ...form, tournamentName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={form.sport}
                    onChange={(e) => setForm({ ...form, sport: e.target.value as SportType })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Football">Football</option>
                    <option value="Carrom">Carrom</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Match Type</label>
                  <input
                    type="text"
                    value={form.matchType}
                    onChange={(e) => setForm({ ...form, matchType: e.target.value })}
                    placeholder="e.g. T20 (20 Overs)"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Opponent Team *</label>
                  <input
                    type="text"
                    value={form.teamBName}
                    onChange={(e) => setForm({ ...form, teamBName: e.target.value })}
                    placeholder="e.g. Minneriya CC"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Opponent Tag</label>
                  <input
                    type="text"
                    value={form.teamBShort}
                    onChange={(e) => setForm({ ...form, teamBShort: e.target.value })}
                    placeholder="MCC"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time</label>
                  <input
                    type="text"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    placeholder="03:00 PM"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ground / Venue</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Confirm Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
