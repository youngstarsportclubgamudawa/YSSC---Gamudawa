import React, { useState, useRef } from 'react';
import {
  GplTeam,
  GplPlayer,
  GplJerseySize,
  GplPlayingRole,
  GplPaymentStatus,
} from '../types';
import {
  Shield,
  Users,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  Download,
  Share2,
  Sparkles,
  Edit3,
  Save,
  RefreshCw,
  Code,
  DollarSign,
  Shirt,
  Phone,
  Copy,
  Check,
  ChevronDown,
  X,
  UserCheck,
} from 'lucide-react';
import { compressPlayerPhoto } from '../utils/imageCompressor';
import {
  saveTeamSquadToGoogleDrive,
  generateTeamSquadCSV,
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_DRIVE_FOLDER_URL,
} from '../services/googleDriveService';
import { googleSignIn, getAccessToken } from '../services/googleAuth';
import { downloadCSV } from '../services/googleSheetsLiveService';

interface TeamManagerPortalProps {
  teams: GplTeam[];
  setTeams: React.Dispatch<React.SetStateAction<GplTeam[]>>;
  lang: 'en' | 'si';
}

const JERSEY_SIZES: GplJerseySize[] = ['S', 'M', 'L', 'XL', 'XXL'];
const PLAYING_ROLES: GplPlayingRole[] = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
const PAYMENT_STATUSES: GplPaymentStatus[] = [
  'Advance Rs. 1,500 Paid',
  'Full Paid (Rs. 3,000)',
  'Pending',
];

export const TeamManagerPortal: React.FC<TeamManagerPortalProps> = ({
  teams,
  setTeams,
  lang,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || 'gpl-team-1');
  const [editingPlayer, setEditingPlayer] = useState<GplPlayer | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    folderUrl?: string;
  } | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [showBackendSnippetModal, setShowBackendSnippetModal] = useState(false);

  // Hidden file input for single player photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoTargetPlayerId, setPhotoTargetPlayerId] = useState<string | null>(null);

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  // Helper to update active team's players in state
  const updateActiveTeam = (updater: (prevTeam: GplTeam) => GplTeam) => {
    setTeams((prevTeams) =>
      prevTeams.map((t) => (t.id === activeTeam.id ? updater(t) : t))
    );
  };

  // Inline field update for player
  const handleInlinePlayerChange = (playerId: string, field: keyof GplPlayer, value: any) => {
    updateActiveTeam((team) => ({
      ...team,
      players: team.players.map((p) => (p.id === playerId ? { ...p, [field]: value } : p)),
    }));
  };

  // Photo upload and client-side compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetPlayerId) return;

    try {
      const compressed = await compressPlayerPhoto(file, 600, 0.82);
      updateActiveTeam((team) => ({
        ...team,
        players: team.players.map((p) =>
          p.id === photoTargetPlayerId
            ? {
                ...p,
                photoUrl: compressed.dataUrl,
                photoFileName: file.name,
              }
            : p
        ),
      }));

      // Also update currently editing modal player if active
      if (editingPlayer && editingPlayer.id === photoTargetPlayerId) {
        setEditingPlayer((prev) =>
          prev ? { ...prev, photoUrl: compressed.dataUrl, photoFileName: file.name } : null
        );
      }
    } catch (err: any) {
      alert(err.message || 'Image upload failed.');
    } finally {
      if (e.target) e.target.value = '';
      setPhotoTargetPlayerId(null);
    }
  };

  const triggerPhotoUpload = (playerId: string) => {
    setPhotoTargetPlayerId(playerId);
    fileInputRef.current?.click();
  };

  // Save modal edits
  const handleSaveModalPlayer = () => {
    if (!editingPlayer) return;
    updateActiveTeam((team) => ({
      ...team,
      players: team.players.map((p) => (p.id === editingPlayer.id ? editingPlayer : p)),
    }));
    setEditingPlayer(null);
  };

  // Google Drive Sync: Saves JSON, CSV, and compressed player portraits into team folder
  const handleSyncToDrive = async () => {
    try {
      setIsSyncingDrive(true);
      setSyncFeedback(null);

      let token = await getAccessToken();
      if (!token) {
        const signin = await googleSignIn();
        token = signin?.accessToken || null;
      }

      if (!token) {
        throw new Error('Google authorization is required to save squad to Drive.');
      }

      const result = await saveTeamSquadToGoogleDrive(token, activeTeam);

      // Save folder URL on team
      updateActiveTeam((team) => ({
        ...team,
        lastDriveSyncTime: new Date().toLocaleTimeString(),
        driveFolderUrl: result.folderUrl,
      }));

      setSyncFeedback({
        type: 'success',
        text:
          lang === 'si'
            ? `✓ ${activeTeam.name} කණ්ඩායමේ විස්තර සහ ක්‍රීඩක ඡායාරූප ${result.uploadedPhotoCount} ක් Google Drive හි සාර්ථකව සුරකින ලදී!`
            : `✓ Successfully synced ${activeTeam.name} squad (CSV, JSON & ${result.uploadedPhotoCount} photos) into Google Drive!`,
        folderUrl: result.folderUrl,
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Failed to sync squad to Google Drive.',
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Export CSV locally
  const handleDownloadCSV = () => {
    const csvContent = generateTeamSquadCSV(activeTeam);
    const fileName = `GPL_2026_${activeTeam.name.replace(/[^a-zA-Z0-9]/g, '_')}_Squad.csv`;
    downloadCSV(fileName, csvContent);
  };

  // Generate formatted WhatsApp announcement
  const handleCopyWhatsApp = () => {
    const lines = [
      `🏏 *GAMUDAWA PREMIER LEAGUE 2026 (GPL)*`,
      `🏆 *OFFICIAL SQUAD: ${activeTeam.name.toUpperCase()}*`,
      `🇱🇰 ${activeTeam.sinhalaName}`,
      `👔 Manager: ${activeTeam.managerName} (${activeTeam.managerPhone})`,
      `👑 Captain: ${activeTeam.captainName} | 🛡️ VC: ${activeTeam.viceCaptainName}`,
      `------------------------------------------`,
      `*PLAYING XI SQUAD:*`,
      ...activeTeam.players.map((p) => {
        const honor = p.isCaptain ? ' *(C)*' : p.isViceCaptain ? ' *(VC)*' : '';
        return `${p.slot}. #${p.jerseyNumber} ${p.name}${honor} - [${p.role}] (Size: ${p.jerseySize})`;
      }),
      `------------------------------------------`,
      `✅ Registration & Kits verified by Young Star Sport Club Gamudawa.`,
    ];

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 3000);
  };

  // Jersey size counts
  const jerseyCounts = activeTeam.players.reduce((acc, p) => {
    acc[p.jerseySize] = (acc[p.jerseySize] || 0) + 1;
    return acc;
  }, {} as Record<GplJerseySize, number>);

  // Payment status counts
  const paidCount = activeTeam.players.filter((p) => p.paymentStatus !== 'Pending').length;
  const totalCollected = activeTeam.players.reduce((sum, p) => {
    if (p.paymentStatus === 'Full Paid (Rs. 3,000)') return sum + 3000;
    if (p.paymentStatus === 'Advance Rs. 1,500 Paid') return sum + 1500;
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Hidden file input for player photos */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gamudawa Premier League (GPL 2026) · Squad Portal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{lang === 'si' ? 'කණ්ඩායම් කළමනාකරණ පද්ධතිය' : 'GPL Team Manager Portal'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'si'
                ? 'කණ්ඩායම් 06 හි නිල ක්‍රීඩකයින් 11 දෙනාගේ විස්තර, ජර්සි අංක, ප්‍රමාණ, ඡායාරූප සහ ගෙවීම් වාර්තා එක්සෙල් හා Google Drive ෆෝල්ඩරය සමඟ කළමනාකරණය කරන්න.'
                : 'Select your assigned team, edit player roles, jersey sizes, payment statuses, and upload portrait photos with automated Google Drive team folder sync.'}
            </p>

            {/* Target Drive folder quick pill */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drive Folder:</span>
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-amber-300 transition"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{GOOGLE_DRIVE_FOLDER_ID}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              {activeTeam.driveFolderUrl && (
                <a
                  href={activeTeam.driveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Team Drive Folder</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncToDrive}
              disabled={isSyncingDrive}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition disabled:opacity-50 active:scale-95"
              title="Save squad & upload player photos to Google Drive"
            >
              {isSyncingDrive ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Drive...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 text-emerald-200" />
                  <span>Save & Sync to Drive</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold shadow-md transition"
              title="Download CSV for Microsoft Excel"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Excel (CSV)</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 rounded-xl text-xs font-bold shadow-md transition"
              title="Copy official squad list formatted for WhatsApp team groups"
            >
              {copiedWhatsapp ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWhatsapp ? 'Copied!' : 'WhatsApp Roster'}</span>
            </button>

            <button
              onClick={() => setShowBackendSnippetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition"
              title="View Node.js / Google Drive Backend API logic"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>API Logic</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs border flex items-center justify-between gap-3 ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
                : 'bg-rose-950/80 border-rose-400/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{syncFeedback.text}</span>
            </div>
            {syncFeedback.folderUrl && (
              <a
                href={syncFeedback.folderUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-white hover:text-amber-300 flex items-center gap-1 shrink-0"
              >
                <span>Open Folder in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 1. TEAM SELECTION CARDS (Team 01 to Team 06) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Select Assigned GPL 2026 Team (කණ්ඩායම තෝරන්න)</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">6 Official Franchises</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {teams.map((team) => {
            const isSelected = team.id === selectedTeamId;
            return (
              <button
                key={team.id}
                onClick={() => {
                  setSelectedTeamId(team.id);
                  setSyncFeedback(null);
                }}
                className={`p-3.5 rounded-2xl text-left transition relative border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-amber-400 shadow-lg ring-2 ring-amber-400/30'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{team.badge}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    T{team.teamNumber}
                  </span>
                </div>

                <div className="font-bold text-xs leading-tight line-clamp-1">{team.name.replace(/^Team \d+ - /, '')}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{team.sinhalaName.replace(/^කණ්ඩායම \d+ - /, '')}</div>

                <div className="mt-2.5 pt-2 border-t border-slate-100/20 text-[10px] flex items-center justify-between">
                  <span className="opacity-75">11 Players</span>
                  <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {team.players.filter((p) => p.paymentStatus !== 'Pending').length}/11 Paid
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Team Header Bar & Summary Stats */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl ${activeTeam.gradient} flex items-center justify-center text-2xl shadow-md border border-white/20`}>
              <span>{activeTeam.badge}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {activeTeam.name}
                </h2>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  GPL 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sinhala">
                {activeTeam.sinhalaName} · Manager: <strong className="text-slate-700">{activeTeam.managerName}</strong> ({activeTeam.managerPhone})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Payment Summary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">GPL Fees Collected</span>
              <div className="text-emerald-950 font-black text-sm">
                LKR {totalCollected.toLocaleString()} <span className="text-emerald-700 text-xs font-normal">({paidCount}/11 verified)</span>
              </div>
            </div>

            {/* Jersey Size Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jersey Kit Sizes (11 Total)</span>
              <div className="flex items-center gap-2 font-mono font-bold text-slate-800 text-xs mt-0.5">
                {JERSEY_SIZES.map((sz) => (
                  <span key={sz} className="inline-flex items-center gap-0.5">
                    <span className="text-slate-400 font-normal">{sz}:</span>
                    <span>{jerseyCounts[sz] || 0}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. SQUAD TABLE (EXACT 11 PLAYERS) */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">Slot</th>
                <th className="py-3 px-3 w-16 text-center">Photo</th>
                <th className="py-3 px-4">Player Official Name</th>
                <th className="py-3 px-3 w-36">Playing Role</th>
                <th className="py-3 px-3 w-28 text-center">Jersey Size</th>
                <th className="py-3 px-3 w-24 text-center">No.</th>
                <th className="py-3 px-4 w-44">GPL Payment Status</th>
                <th className="py-3 px-3 w-32">Phone</th>
                <th className="py-3 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {activeTeam.players.map((player) => {
                const isPaidFull = player.paymentStatus === 'Full Paid (Rs. 3,000)';
                const isAdvance = player.paymentStatus === 'Advance Rs. 1,500 Paid';

                return (
                  <tr key={player.id} className="hover:bg-amber-50/40 transition">
                    {/* Slot */}
                    <td className="py-3 px-3 text-center font-bold text-slate-500 bg-slate-50">
                      {player.slot}
                    </td>

                    {/* Photo with direct upload button */}
                    <td className="py-2 px-3 text-center">
                      <div className="relative group mx-auto w-10 h-10">
                        <img
                          src={player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-amber-400 transition"
                        />
                        <button
                          onClick={() => triggerPhotoUpload(player.id)}
                          className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                          title="Upload new portrait photo"
                        >
                          <Camera className="w-4 h-4 text-amber-300" />
                        </button>
                      </div>
                    </td>

                    {/* Official Name & Sinhala */}
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleInlinePlayerChange(player.id, 'name', e.target.value)}
                          className="w-full bg-transparent font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/30 px-1 py-0.5 rounded outline-none transition"
                        />
                        {player.isCaptain && (
                          <span className="shrink-0 text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                            C
                          </span>
                        )}
                        {player.isViceCaptain && (
                          <span className="shrink-0 text-[10px] bg-slate-700 text-white font-bold px-1.5 py-0.5 rounded">
                            VC
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={player.sinhalaName || ''}
                        placeholder="සිංහල නම..."
                        onChange={(e) => handleInlinePlayerChange(player.id, 'sinhalaName', e.target.value)}
                        className="w-full bg-transparent text-[11px] text-slate-500 font-sinhala border-b border-transparent hover:border-slate-300 focus:border-amber-500 px-1 py-0.5 rounded outline-none transition"
                      />
                    </td>

                    {/* Playing Role */}
                    <td className="py-2.5 px-3">
                      <select
                        value={player.role}
                        onChange={(e) => handleInlinePlayerChange(player.id, 'role', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      >
                        {PLAYING_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Jersey Size */}
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={player.jerseySize}
                        onChange={(e) => handleInlinePlayerChange(player.id, 'jerseySize', e.target.value)}
                        className="w-20 px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:border-amber-500 text-center"
                      >
                        {JERSEY_SIZES.map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Jersey Number */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={player.jerseyNumber}
                        onChange={(e) => handleInlinePlayerChange(player.id, 'jerseyNumber', parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1.5 text-xs font-mono font-black text-center rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:border-amber-500"
                      />
                    </td>

                    {/* Payment Status */}
                    <td className="py-2.5 px-4">
                      <select
                        value={player.paymentStatus}
                        onChange={(e) => handleInlinePlayerChange(player.id, 'paymentStatus', e.target.value)}
                        className={`w-full px-2 py-1.5 text-xs font-bold rounded-lg border transition ${
                          isPaidFull
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isAdvance
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {PAYMENT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Contact Phone */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={player.phone}
                        onChange={(e) => handleInlinePlayerChange(player.id, 'phone', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:border-amber-500"
                      />
                    </td>

                    {/* Actions: Modal Edit & Photo */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingPlayer({ ...player })}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                          title="Full player details & NIC"
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                        </button>
                        <button
                          onClick={() => triggerPhotoUpload(player.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition"
                          title="Upload / Change Portrait"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Squad Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            * All 11 player entries are validated for GPL 2026 kit manufacturing and player passes.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToDrive}
              disabled={isSyncingDrive}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50"
            >
              {isSyncingDrive ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving & Uploading to Drive...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Update Squad to Drive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODAL FOR DETAILED PLAYER EDITING */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950">
                  {editingPlayer.slot}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Edit Player #{editingPlayer.slot}</h3>
                  <p className="text-xs text-slate-500">{activeTeam.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo preview and replace */}
            <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <img
                src={editingPlayer.photoUrl}
                alt={editingPlayer.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-sm"
              />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 block">Portrait Photograph</span>
                <p className="text-[11px] text-slate-500">Auto-compressed client-side for fast Drive upload.</p>
                <button
                  type="button"
                  onClick={() => triggerPhotoUpload(editingPlayer.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  <span>Choose Photo</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Full Name</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sinhala Name</label>
                <input
                  type="text"
                  value={editingPlayer.sinhalaName || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, sinhalaName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-sinhala"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Playing Role</label>
                <select
                  value={editingPlayer.role}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value as GplPlayingRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-medium bg-white"
                >
                  {PLAYING_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jersey Size</label>
                <select
                  value={editingPlayer.jerseySize}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, jerseySize: e.target.value as GplJerseySize })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-bold bg-white"
                >
                  {JERSEY_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      Size {sz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jersey Number</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={editingPlayer.jerseyNumber}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, jerseyNumber: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NIC Number</label>
                <input
                  type="text"
                  value={editingPlayer.nic}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, nic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingPlayer.phone}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                <select
                  value={editingPlayer.paymentStatus}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, paymentStatus: e.target.value as GplPaymentStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-bold bg-white"
                >
                  {PAYMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leadership honor toggles */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={!!editingPlayer.isCaptain}
                  onChange={(e) =>
                    setEditingPlayer({
                      ...editingPlayer,
                      isCaptain: e.target.checked,
                      isViceCaptain: e.target.checked ? false : editingPlayer.isViceCaptain,
                    })
                  }
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Team Captain (C)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={!!editingPlayer.isViceCaptain}
                  onChange={(e) =>
                    setEditingPlayer({
                      ...editingPlayer,
                      isViceCaptain: e.target.checked,
                      isCaptain: e.target.checked ? false : editingPlayer.isCaptain,
                    })
                  }
                  className="w-4 h-4 rounded text-slate-700 focus:ring-slate-500"
                />
                <span>Vice-Captain (VC)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalPlayer}
                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Save Player Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. BACKEND API SNIPPET MODAL (As requested by Technical Specs) */}
      {showBackendSnippetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Node.js / Express Google Drive API Endpoint</h3>
              </div>
              <button
                onClick={() => setShowBackendSnippetModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Below is the backend logic for storing uploaded portraits and squad rosters using the official <code className="text-amber-400">googleapis</code> Drive API (<code className="text-emerald-400">drive.files.create</code>):
            </p>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96">
{`// server/routes/gplDriveSync.js
import express from 'express';
import { google } from 'googleapis';
import stream from 'stream';

const router = express.Router();

// OAuth2 Client setup with user Bearer token
function getDriveClient(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// POST /api/gpl/sync-squad
router.post('/sync-squad', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Bearer token' });
    const accessToken = authHeader.replace('Bearer ', '');
    const drive = getDriveClient(accessToken);

    const { team, parentFolderId = '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96' } = req.body;

    // 1. Create Team Folder inside parent Google Drive folder
    const folderMetadata = {
      name: \`GPL_2026_Team_\${team.teamNumber}_\${team.name.replace(/\\s+/g, '_')}\`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };
    const folderRes = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink',
    });
    const teamFolderId = folderRes.data.id;

    // 2. Upload JSON Roster
    const jsonBuffer = Buffer.from(JSON.stringify(team, null, 2), 'utf-8');
    const jsonStream = new stream.PassThrough();
    jsonStream.end(jsonBuffer);

    await drive.files.create({
      resource: { name: \`GPL2026_Team_\${team.teamNumber}_Roster.json\`, parents: [teamFolderId] },
      media: { mimeType: 'application/json', body: jsonStream },
    });

    // 3. Upload Compressed Player Portraits
    let uploadedCount = 0;
    for (const player of team.players) {
      if (player.photoUrl && player.photoUrl.startsWith('data:image')) {
        const base64Data = player.photoUrl.replace(/^data:image\\/\\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        const imgStream = new stream.PassThrough();
        imgStream.end(imgBuffer);

        await drive.files.create({
          resource: {
            name: \`Player_\${player.slot}_No\${player.jerseyNumber}_\${player.name.replace(/\\s+/g, '_')}.jpg\`,
            parents: [teamFolderId],
          },
          media: { mimeType: 'image/jpeg', body: imgStream },
        });
        uploadedCount++;
      }
    }

    return res.json({
      success: true,
      folderId: teamFolderId,
      folderUrl: folderRes.data.webViewLink,
      uploadedPhotos: uploadedCount,
    });
  } catch (error) {
    console.error('Drive sync failed:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;`}
            </pre>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Target Folder: <strong className="text-amber-400">{GOOGLE_DRIVE_FOLDER_ID}</strong></span>
              <button
                onClick={() => setShowBackendSnippetModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
