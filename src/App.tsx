import React, { useState, useEffect } from 'react';
import { Member, TeamSquad, MatchScorecard, FinancialTransaction, MediaItem } from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_SQUADS,
  INITIAL_MATCHES,
  INITIAL_TRANSACTIONS,
  INITIAL_MEDIA,
  INITIAL_COMMITTEE,
  INITIAL_DOCUMENTS,
} from './data/initialData';
import { Header } from './components/Header';
import { LiveScorecard } from './components/LiveScorecard';
import { MemberManagement } from './components/MemberManagement';
import { TeamSquads } from './components/TeamSquads';
import { TournamentsFixtures } from './components/TournamentsFixtures';
import { FinancialTracker } from './components/FinancialTracker';
import { MediaGallery } from './components/MediaGallery';
import { CommitteeDocuments } from './components/CommitteeDocuments';
import { CheckCircle2, Shield, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('scorecard');
  const [lang, setLang] = useState<'en' | 'si'>('en');

  // Persistent / State collections
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('yssc_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [squads, setSquads] = useState<TeamSquad[]>(() => {
    const saved = localStorage.getItem('yssc_squads');
    return saved ? JSON.parse(saved) : INITIAL_SQUADS;
  });

  const [matches, setMatches] = useState<MatchScorecard[]>(() => {
    const saved = localStorage.getItem('yssc_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('yssc_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [media, setMedia] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('yssc_media');
    return saved ? JSON.parse(saved) : INITIAL_MEDIA;
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('yssc_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('yssc_squads', JSON.stringify(squads));
  }, [squads]);

  useEffect(() => {
    localStorage.setItem('yssc_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('yssc_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('yssc_media', JSON.stringify(media));
  }, [media]);

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

        {activeTab === 'gallery' && (
          <MediaGallery
            media={media}
            onAddMedia={handleAddMedia}
            lang={lang}
          />
        )}

        {activeTab === 'committee' && (
          <CommitteeDocuments
            committee={INITIAL_COMMITTEE}
            documents={INITIAL_DOCUMENTS}
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
