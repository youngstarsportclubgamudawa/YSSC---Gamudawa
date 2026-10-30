import React, { useState, useEffect } from 'react';
import {
  Member,
  TeamSquad,
  MatchScorecard,
  FinancialTransaction,
  MediaItem,
  CommitteeMember,
  ClubDocument,
  ClubProfileInfo,
  GplTeam,
} from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_SQUADS,
  INITIAL_MATCHES,
  INITIAL_TRANSACTIONS,
  INITIAL_MEDIA,
  INITIAL_COMMITTEE,
  INITIAL_DOCUMENTS,
  INITIAL_CLUB_PROFILE,
} from './data/initialData';
import { INITIAL_GPL_TEAMS } from './data/initialGplTeams';
import { Header } from './components/Header';
import { LiveScorecard } from './components/LiveScorecard';
import { MemberManagement } from './components/MemberManagement';
import { TeamSquads } from './components/TeamSquads';
import { TeamManagerPortal } from './components/TeamManagerPortal';
import { TournamentsFixtures } from './components/TournamentsFixtures';
import { FinancialTracker } from './components/FinancialTracker';
import { MediaGallery } from './components/MediaGallery';
import { CommitteeDocuments } from './components/CommitteeDocuments';
import { GoogleSheetsLiveManager } from './components/GoogleSheetsLiveManager';
import { CheckCircle2, Shield, Heart } from 'lucide-react';

function getSafeStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function setSafeStorage(key: string, value: any): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('scorecard');
  const [lang, setLang] = useState<'en' | 'si'>('en');

  // Persistent / State collections safely guarded
  const [members, setMembers] = useState<Member[]>(() =>
    getSafeStorage('yssc_members', INITIAL_MEMBERS)
  );

  const [squads, setSquads] = useState<TeamSquad[]>(() =>
    getSafeStorage('yssc_squads', INITIAL_SQUADS)
  );

  const [matches, setMatches] = useState<MatchScorecard[]>(() =>
    getSafeStorage('yssc_matches', INITIAL_MATCHES)
  );

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() =>
    getSafeStorage('yssc_transactions', INITIAL_TRANSACTIONS)
  );

  const [media, setMedia] = useState<MediaItem[]>(() =>
    getSafeStorage('yssc_media', INITIAL_MEDIA)
  );

  const [committee, setCommittee] = useState<CommitteeMember[]>(() =>
    getSafeStorage('yssc_committee', INITIAL_COMMITTEE)
  );

  const [documents, setDocuments] = useState<ClubDocument[]>(() =>
    getSafeStorage('yssc_documents', INITIAL_DOCUMENTS)
  );

  const [clubProfile, setClubProfile] = useState<ClubProfileInfo>(() =>
    getSafeStorage('yssc_club_profile', INITIAL_CLUB_PROFILE)
  );

  const [gplTeams, setGplTeams] = useState<GplTeam[]>(() =>
    getSafeStorage('yssc_gpl_teams', INITIAL_GPL_TEAMS)
  );

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    setSafeStorage('yssc_gpl_teams', gplTeams);
  }, [gplTeams]);

  // Sync to localStorage safely
  useEffect(() => {
    setSafeStorage('yssc_members', members);
  }, [members]);

  useEffect(() => {
    setSafeStorage('yssc_squads', squads);
  }, [squads]);

  useEffect(() => {
    setSafeStorage('yssc_matches', matches);
  }, [matches]);

  useEffect(() => {
    setSafeStorage('yssc_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    setSafeStorage('yssc_media', media);
  }, [media]);

  useEffect(() => {
    setSafeStorage('yssc_committee', committee);
  }, [committee]);

  useEffect(() => {
    setSafeStorage('yssc_documents', documents);
  }, [documents]);

  useEffect(() => {
    setSafeStorage('yssc_club_profile', clubProfile);
  }, [clubProfile]);

  // Handlers
  const handleAddMember = (newMember: Member) => {
    setMembers((prev) => [newMember, ...prev]);
    showToast(`✓ Member ${newMember.name} registered successfully!`);
  };

  const handleUpdateMember = (updated: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`✓ Member ${updated.name} updated.`);
  };

  const handleUpdateMemberDues = (memberId: string, additionalWeeks: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, weeklyDuesPaidCount: m.weeklyDuesPaidCount + additionalWeeks }
          : m
      )
    );
  };

  const handleUpdateSquad = (updatedSquad: TeamSquad) => {
    setSquads((prev) => prev.map((s) => (s.id === updatedSquad.id ? updatedSquad : s)));
    showToast(`✓ Squad ${updatedSquad.name} updated.`);
  };

  const handleAddSquad = (newSquad: TeamSquad) => {
    setSquads((prev) => [...prev, newSquad]);
    showToast(`✓ New Squad ${newSquad.name} created!`);
  };

  const handleUpdateMatch = (updatedMatch: MatchScorecard) => {
    setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));
  };

  const handleAddMatch = (newMatch: MatchScorecard) => {
    setMatches((prev) => [newMatch, ...prev]);
    showToast(`✓ Match "${newMatch.title}" scheduled!`);
  };

  const handleAddTransaction = (newTx: FinancialTransaction) => {
    setTransactions((prev) => [newTx, ...prev]);
    showToast(`✓ Payment of LKR ${newTx.amount.toLocaleString()} recorded (${newTx.receiptNumber})!`);
  };

  const handleAddMedia = (newItem: MediaItem) => {
    setMedia((prev) => [newItem, ...prev]);
    showToast(`✓ Photo "${newItem.title}" added to gallery!`);
  };

  const liveMatches = matches.filter((m) => m.status === 'live');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={lang}
        onLangToggle={() => setLang((prev) => (prev === 'en' ? 'si' : 'en'))}
        liveMatchCount={liveMatches.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scorecard' && (
          <LiveScorecard
            matches={matches}
            onUpdateMatch={handleUpdateMatch}
            lang={lang}
          />
        )}

        {activeTab === 'members' && (
          <MemberManagement
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            lang={lang}
          />
        )}

        {activeTab === 'squads' && (
          <TeamSquads
            squads={squads}
            members={members}
            onUpdateSquad={handleUpdateSquad}
            onAddSquad={handleAddSquad}
            lang={lang}
          />
        )}

        {activeTab === 'gpl_manager' && (
          <TeamManagerPortal
            teams={gplTeams}
            setTeams={setGplTeams}
            lang={lang}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentsFixtures
            matches={matches}
            onAddMatch={handleAddMatch}
            onSelectLiveMatch={(id) => {
              setActiveTab('scorecard');
            }}
            lang={lang}
          />
        )}

        {activeTab === 'finances' && (
          <FinancialTracker
            transactions={transactions}
            members={members}
            onAddTransaction={handleAddTransaction}
            onUpdateMemberDues={handleUpdateMemberDues}
            lang={lang}
          />
        )}

        {activeTab === 'gsheet' && (
          <GoogleSheetsLiveManager
            members={members}
            setMembers={setMembers}
            matches={matches}
            setMatches={setMatches}
            squads={squads}
            setSquads={setSquads}
            transactions={transactions}
            setTransactions={setTransactions}
            committee={committee}
            setCommittee={setCommittee}
            documents={documents}
            setDocuments={setDocuments}
            media={media}
            setMedia={setMedia}
            clubProfile={clubProfile}
            setClubProfile={setClubProfile}
            onAddTransaction={handleAddTransaction}
            onUpdateMemberDues={handleUpdateMemberDues}
            lang={lang}
          />
        )}

        {activeTab === 'gallery' && (
          <MediaGallery
            media={media}
            onAddMedia={handleAddMedia}
            lang={lang}
          />
        )}

        {activeTab === 'committee' && (
          <CommitteeDocuments
            committee={committee}
            documents={documents}
            lang={lang}
          />
        )}

      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-2.5 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shrink-0">
              ⭐
            </div>
            <div>
              <div className="font-bold text-slate-200">
                Young Star Sports Club Gamudawa (තරුණ තරු ක්‍රීඩා සමාජය ගම්උදාව)
              </div>
              <div className="text-[11px] text-slate-500">
                Govt Reg: DS/SP/2018/14 · Official Contact:{' '}
                <a
                  href="mailto:youngstarsportclubgamudawa@gmail.com"
                  className="text-amber-400 hover:underline"
                >
                  youngstarsportclubgamudawa@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500 space-y-1">
            <div>Weekly Membership Dues (LKR 100/Wk) · Live Tournament Dashboard</div>
            <div>© 2018 - 2026 Young Star SC. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
