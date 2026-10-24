import React, { useState } from 'react';
import { TeamSquad, Member, SportType } from '../types';
import { Shield, Users, UserCheck, Star, Share2, Plus, Check } from 'lucide-react';

interface TeamSquadsProps {
  squads: TeamSquad[];
  members: Member[];
  onUpdateSquad: (squad: TeamSquad) => void;
  onAddSquad: (squad: TeamSquad) => void;
  lang: 'en' | 'si';
}

export const TeamSquads: React.FC<TeamSquadsProps> = ({
  squads,
  members,
  onUpdateSquad,
  onAddSquad,
  lang,
}) => {
  const [selectedSquadId, setSelectedSquadId] = useState<string>(squads[0]?.id || '');
  const [isAddSquadModalOpen, setIsAddSquadModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadSinhala, setNewSquadSinhala] = useState('');
  const [newSquadSport, setNewSquadSport] = useState<SportType>('Cricket');
  const [newSquadJersey, setNewSquadJersey] = useState('Emerald & Gold');

  const activeSquad = squads.find((s) => s.id === selectedSquadId) || squads[0];

  const captain = members.find((m) => m.id === activeSquad?.captainId);
  const viceCaptain = members.find((m) => m.id === activeSquad?.viceCaptainId);

  // Players currently in this squad
  const squadPlayers = members.filter((m) => activeSquad?.playerIds.includes(m.id));

  // Available members who play this sport but are not yet in the squad
  const availableMembers = members.filter(
    (m) => m.sports.includes(activeSquad?.sport) && !activeSquad?.playerIds.includes(m.id)
  );

  const handleTogglePlayer = (memberId: string) => {
    if (!activeSquad) return;
    const exists = activeSquad.playerIds.includes(memberId);
    let newPlayerIds: string[];
    if (exists) {
      newPlayerIds = activeSquad.playerIds.filter((id) => id !== memberId);
    } else {
      newPlayerIds = [...activeSquad.playerIds, memberId];
    }

    onUpdateSquad({
      ...activeSquad,
      playerIds: newPlayerIds,
    });
  };

  const handleSetCaptain = (memberId: string) => {
    if (!activeSquad) return;
    onUpdateSquad({
      ...activeSquad,
      captainId: memberId,
    });
  };

  const handleShareSquadWhatsApp = () => {
    if (!activeSquad) return;
    const playerNames = squadPlayers
      .map((p, idx) => `${idx + 1}. ${p.name} (${p.primaryRole})`)
      .join('\n');

    const message = encodeURIComponent(
      `🛡️ *OFFICIAL SQUAD LINEUP · YOUNG STAR SC GAMUDAWA*\n` +
      `🏅 *${activeSquad.name}* (${activeSquad.sport})\n` +
      `👑 Captain: ${captain?.name || 'TBD'}\n` +
      (viceCaptain ? `⭐ Vice Captain: ${viceCaptain.name}\n` : '') +
      `🎽 Jersey Colors: ${activeSquad.jerseyColor}\n\n` +
      `*Selected Squad:*\n${playerNames}\n\n` +
      `Young Star Sports Club Gamudawa Management`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const handleCreateSquadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;

    const newSquad: TeamSquad = {
      id: `squad-${Date.now()}`,
      name: newSquadName.trim(),
      sinhalaName: newSquadSinhala.trim() || newSquadName.trim(),
      sport: newSquadSport,
      captainId: members[0]?.id || '',
      playerIds: members.filter((m) => m.sports.includes(newSquadSport)).slice(0, 5).map((m) => m.id),
      jerseyColor: newSquadJersey,
    };

    onAddSquad(newSquad);
    setSelectedSquadId(newSquad.id);
    setIsAddSquadModalOpen(false);
    setNewSquadName('');
    setNewSquadSinhala('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {lang === 'si' ? 'කණ්ඩායම් සහ ක්‍රීඩක සංචිත කළමනාකරණය' : 'Teams & Squad Allocation'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'si'
              ? 'නිල ක්‍රිකට්, වොලිබෝල්, පාපන්දු හා කැරම් කණ්ඩායම් සංචිත'
              : 'Official playing squads, captaincy allocation, and matchday lineups'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShareSquadWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? 'සංචිතය වට්ස්ඇප් වෙත යවන්න' : 'Share Squad to WhatsApp'}</span>
          </button>

          <button
            onClick={() => setIsAddSquadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Squad</span>
          </button>
        </div>
      </div>

      {/* Squad Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {squads.map((squad) => (
          <button
            key={squad.id}
            onClick={() => setSelectedSquadId(squad.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              selectedSquadId === squad.id
                ? 'bg-slate-900 text-amber-400 shadow-md border border-slate-700'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{squad.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
              {squad.playerIds.length}
            </span>
          </button>
        ))}
      </div>

      {activeSquad && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Squad Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                {activeSquad.sport} Division
              </span>
              <h3 className="text-lg font-black text-slate-900">{activeSquad.name}</h3>
              <p className="text-xs text-slate-500">{activeSquad.sinhalaName}</p>
            </div>

            {/* Leadership Box */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Team Captain
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {captain ? captain.name : 'Not Designated'}
                  </p>
                  <p className="text-[11px] text-slate-500">{captain?.primaryRole}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  👑
                </div>
              </div>

              {viceCaptain && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Vice Captain
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">{viceCaptain.name}</p>
                    <p className="text-[11px] text-slate-500">{viceCaptain.primaryRole}</p>
                  </div>
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
              )}

              <div className="pt-2 text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jersey Color:</span>
                  <span className="font-semibold text-slate-800">{activeSquad.jerseyColor}</span>
                </div>
                {activeSquad.coachName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Head Coach:</span>
                    <span className="font-semibold text-slate-800">{activeSquad.coachName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Squad Strength:</span>
                  <span className="font-semibold text-slate-800">{squadPlayers.length} Sportsmen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Squad Lineup Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Selected Squad ({squadPlayers.length} Players)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Click crown to assign captaincy or remove player from lineup
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {squadPlayers.map((player) => {
                const isCaptain = player.id === activeSquad.captainId;
                return (
                  <div key={player.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        className="w-10 h-10 rounded-lg object-cover border"
                      />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{player.name}</span>
                          {isCaptain && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                              CAPTAIN
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500">
                          {player.primaryRole} {player.jerseyNumber && `· #${player.jerseyNumber}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCaptain && (
                        <button
                          onClick={() => handleSetCaptain(player.id)}
                          className="text-[11px] px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold transition"
                          title="Make Captain"
                        >
                          Make Captain
                        </button>
                      )}
                      <button
                        onClick={() => handleTogglePlayer(player.id)}
                        className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {squadPlayers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No players currently allocated to this squad. Select from available pool below.
                </div>
              )}
            </div>

            {/* Available Members to Add */}
            {availableMembers.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Available {activeSquad.sport} Members ({availableMembers.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleTogglePlayer(m.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-xs text-slate-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-500" />
                      <span>{m.name}</span>
                      <span className="text-[10px] text-slate-400">({m.primaryRole})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Squad Modal */}
      {isAddSquadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create New Team Squad</h3>
            <form onSubmit={handleCreateSquadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Squad Name *</label>
                <input
                  type="text"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="e.g. Gamudawa Warriors B"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sinhala Name</label>
                <input
                  type="text"
                  value={newSquadSinhala}
                  onChange={(e) => setNewSquadSinhala(e.target.value)}
                  placeholder="උදා: ගම්උදාව වොරියර්ස්"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sport</label>
                <select
                  value={newSquadSport}
                  onChange={(e) => setNewSquadSport(e.target.value as SportType)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Football">Football</option>
                  <option value="Carrom">Carrom</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Athletics">Athletics</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jersey Colors</label>
                <input
                  type="text"
                  value={newSquadJersey}
                  onChange={(e) => setNewSquadJersey(e.target.value)}
                  placeholder="e.g. Royal Blue & Gold"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSquadModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
