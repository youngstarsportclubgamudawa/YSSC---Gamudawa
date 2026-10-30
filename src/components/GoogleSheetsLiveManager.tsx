import React, { useState, useEffect, useRef } from 'react';
import {
  Member,
  FinancialTransaction,
  CommitteeMember,
  TeamSquad,
  MatchScorecard,
  ClubDocument,
  MediaItem,
  ClubProfileInfo,
  SportType,
} from '../types';
import {
  FileSpreadsheet,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Shield,
  DollarSign,
  Users,
  Search,
  FolderOpen,
  LogOut,
  Sparkles,
  ArrowRight,
  Plus,
  Layers,
  Database,
  Calendar,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Download,
  UploadCloud,
  Edit3,
  Trash2,
  Save,
  Trophy,
  Activity,
  FileText,
  Image,
  Info,
  Check,
} from 'lucide-react';
import {
  fetchSpreadsheetMeta,
  fetchSheetGridData,
  syncWeeklyPaymentsToSheet,
  readWeeklyPaymentsFromSheet,
  syncExpensesToSheet,
  readExpensesFromSheet,
  syncMatchesToSheet,
  readMatchesFromSheet,
  syncMembersToSheet,
  readMembersFromSheet,
  syncClubProfileToSheet,
  readClubProfileFromSheet,
  syncSquadsToSheet,
  syncCommitteeToSheet,
  syncDocumentsToSheet,
  syncMediaToSheet,
  syncLiveScorecardToSheet,
  createOfficialMasterSpreadsheet,
  pushAllDataToMasterSpreadsheet,
  readAllDataFromMasterSpreadsheet,
  createNewSheetTabInSpreadsheet,
  appendRowToSheet,
  extractSpreadsheetId,
  gridToCSV,
  downloadCSV,
  LiveSpreadsheetMeta,
  CustomSheetData,
  SheetTabInfo,
  CompleteClubData,
} from '../services/googleSheetsLiveService';
import { googleSignIn, logoutGoogle, initAuth } from '../services/googleAuth';
import {
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_DRIVE_FOLDER_URL,
  saveExactCharterCSVToGoogleDrive,
  generateExactCharterCSVContent,
  parseExactCharterCSV,
} from '../services/googleDriveService';
import { normalizeSheetDate, formatDisplayDate } from '../utils/dateUtils';
import { User } from 'firebase/auth';

interface GoogleSheetsLiveManagerProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  matches: MatchScorecard[];
  setMatches: React.Dispatch<React.SetStateAction<MatchScorecard[]>>;
  squads: TeamSquad[];
  setSquads: React.Dispatch<React.SetStateAction<TeamSquad[]>>;
  transactions: FinancialTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  committee: CommitteeMember[];
  setCommittee: React.Dispatch<React.SetStateAction<CommitteeMember[]>>;
  documents: ClubDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ClubDocument[]>>;
  media: MediaItem[];
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  clubProfile: ClubProfileInfo;
  setClubProfile: React.Dispatch<React.SetStateAction<ClubProfileInfo>>;
  onAddTransaction: (tx: FinancialTransaction) => void;
  onUpdateMemberDues: (memberId: string, additionalWeeks: number) => void;
  lang: 'en' | 'si';
}

const DEFAULT_SPREADSHEET_KEY = 'yssc_active_spreadsheet_id';

type ActiveModule =
  | 'matches'
  | 'live_scorecard'
  | 'payments'
  | 'expenses'
  | 'members'
  | 'profile'
  | 'squads'
  | 'committee'
  | 'documents'
  | 'media'
  | 'dynamic_sheets';

export const GoogleSheetsLiveManager: React.FC<GoogleSheetsLiveManagerProps> = ({
  members,
  setMembers,
  matches,
  setMatches,
  squads,
  setSquads,
  transactions,
  setTransactions,
  committee,
  setCommittee,
  documents,
  setDocuments,
  media,
  setMedia,
  clubProfile,
  setClubProfile,
  onAddTransaction,
  onUpdateMemberDues,
  lang,
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      return localStorage.getItem(DEFAULT_SPREADSHEET_KEY) || '';
    } catch {
      return '';
    }
  });
  const [spreadsheetMeta, setSpreadsheetMeta] = useState<LiveSpreadsheetMeta | null>(null);
  const [inputSpreadsheetUrl, setInputSpreadsheetUrl] = useState('');
  const [isChangingSheet, setIsChangingSheet] = useState(false);

  // Sync state & live real-time toggle
  const [isLiveAutoSync, setIsLiveAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Not yet synced');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  // Sub-tabs within Live Manager
  const [activeModule, setActiveModule] = useState<ActiveModule>('matches');

  // Search & Filter
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');

  // Editing state for in-grid live edits
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string; val: string } | null>(null);

  // Modals for adding items
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState(false);
  const [newMatchTitle, setNewMatchTitle] = useState('');
  const [newMatchTournament, setNewMatchTournament] = useState('Gamudawa Premier Trophy 2026');
  const [newMatchSport, setNewMatchSport] = useState<SportType>('Cricket');
  const [newMatchDate, setNewMatchDate] = useState('2026-10-31');
  const [newMatchTime, setNewMatchTime] = useState('02:30 PM');
  const [newMatchVenue, setNewMatchVenue] = useState('Gamudawa Mahinda Rajapaksa Ground');
  const [newMatchTeamB, setNewMatchTeamB] = useState('North Central United');

  // Payment recording modal
  const [isRecordDuesModalOpen, setIsRecordDuesModalOpen] = useState(false);
  const [duesMemberId, setDuesMemberId] = useState(members[0]?.id || '');
  const [duesWeeks, setDuesWeeks] = useState(2);
  const [duesNotes, setDuesNotes] = useState('');

  // Expense modal
  const [isRecordExpenseModalOpen, setIsRecordExpenseModalOpen] = useState(false);
  const [expName, setExpName] = useState('');
  const [expCategory, setExpCategory] = useState<'income' | 'expense'>('expense');
  const [expType, setExpType] = useState<FinancialTransaction['type']>('equipment_expense');
  const [expAmount, setExpAmount] = useState('5000');
  const [expMethod, setExpMethod] = useState<'Cash' | 'Bank Transfer' | 'Online QR' | 'Google Sheet Sync'>('Bank Transfer');
  const [expNotes, setExpNotes] = useState('');

  // Dynamic Sheets state
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [customSheetData, setCustomSheetData] = useState<CustomSheetData | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetHeaders, setNewSheetHeaders] = useState('ID, Item Name, Category, Quantity, Status, Notes');
  const [isAddSheetModalOpen, setIsAddSheetModalOpen] = useState(false);

  // User Confirmation Modal (MANDATORY for Workspace write mutations)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: 'Confirm & Sync',
    onConfirm: async () => {},
  });

  const pollTimerRef = useRef<any>(null);
  const [profileViewMode, setProfileViewMode] = useState<'excel' | 'cards'>('excel');
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingCharterToDrive, setIsSavingCharterToDrive] = useState(false);

  const handleSaveCharterCSVToDrive = async () => {
    try {
      setIsSavingCharterToDrive(true);
      setErrorMessage(null);
      let activeTok = token;
      if (!activeTok) {
        const signin = await googleSignIn();
        activeTok = signin?.accessToken || null;
      }
      if (!activeTok) {
        throw new Error('Google authorization is required to save to Drive.');
      }
      const res = await saveExactCharterCSVToGoogleDrive(activeTok, clubProfile);
      setSyncStatusMessage(
        lang === 'si'
          ? `✓ Young_Star_Sport_Club_Gamudawa.csv ගොනුව ඔබගේ Google Drive ෆෝල්ඩරයේ සාර්ථකව සුරකින ලදී!`
          : `✓ Young_Star_Sport_Club_Gamudawa.csv saved successfully to linked Google Drive folder!`
      );
      addLog(`Saved Young_Star_Sport_Club_Gamudawa.csv to Drive folder (${res.name || 'Charter CSV'})`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save charter CSV to Google Drive');
    } finally {
      setIsSavingCharterToDrive(false);
    }
  };

  const handleImportCharterCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        const parsed = parseExactCharterCSV(text);
        setClubProfile((prev) => ({
          ...prev,
          ...parsed,
        }));
        setSyncStatusMessage(
          lang === 'si'
            ? '✓ එක්සෙල් ගොනුවෙන් දැක්ම සහ මෙහෙවර සාර්ථකව යාවත්කාලීන විය!'
            : '✓ Successfully imported vision and mission from uploaded Excel CSV file!'
        );
        addLog('Imported and applied updated details from Excel CSV file.');
        if (token && spreadsheetId) {
          syncClubProfileToSheet(token, spreadsheetId, { ...clubProfile, ...parsed }).catch(console.warn);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleSaveProfileChanges = async () => {
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      if (token && spreadsheetId) {
        await syncClubProfileToSheet(token, spreadsheetId, clubProfile);
      }
      setSyncStatusMessage(
        lang === 'si'
          ? '✓ ක්‍රීඩා සමාජයේ තොරතුරු සාර්ථකව සුරකින ලදී!'
          : '✓ Club profile, vision & mission saved and synced successfully!'
      );
      addLog('Club profile & charter details updated.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync profile changes');
    } finally {
      setIsSyncing(false);
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setActivityLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, userToken) => {
        setGoogleUser(user);
        setToken(userToken);
        addLog(`Connected as ${user.displayName || user.email}`);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
        addLog(`Successfully signed in: ${res.user.email}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-in failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setToken(null);
    addLog('Signed out of Google account');
  };

  // Load Spreadsheet metadata when spreadsheetId or token changes
  useEffect(() => {
    if (!token || !spreadsheetId) return;

    let isMounted = true;
    fetchSpreadsheetMeta(token, spreadsheetId)
      .then((meta) => {
        if (!isMounted) return;
        setSpreadsheetMeta(meta);
        addLog(`Loaded spreadsheet: "${meta.title}" (${meta.sheets.length} tabs)`);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not load spreadsheet meta:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [token, spreadsheetId]);

  // Real-time automatic background polling
  useEffect(() => {
    if (!isLiveAutoSync || !token || !spreadsheetId) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const runAutoSync = async () => {
      try {
        const updates = await readAllDataFromMasterSpreadsheet(token, spreadsheetId);
        let updatedCount = 0;

        if (updates.matches && updates.matches.length > 0) {
          setMatches(updates.matches);
          updatedCount++;
        }
        if (updates.members && updates.members.length > 0) {
          setMembers(updates.members);
          updatedCount++;
        }
        if (updates.duesMap && Object.keys(updates.duesMap).length > 0) {
          setMembers((prev) =>
            prev.map((m) => {
              if (updates.duesMap![m.regNumber] !== undefined) {
                return { ...m, weeklyDuesPaidCount: updates.duesMap![m.regNumber] };
              }
              return m;
            })
          );
          updatedCount++;
        }
        if (updates.transactions && updates.transactions.length > 0) {
          setTransactions(updates.transactions);
          updatedCount++;
        }
        if (updates.profile) {
          setClubProfile((prev) => ({ ...prev, ...updates.profile }));
          updatedCount++;
        }

        const now = new Date().toLocaleTimeString();
        setLastSyncedTime(now);
        if (updatedCount > 0) {
          addLog(`Real-time sync complete: Updated ${updatedCount} modules from Google Sheet.`);
        }
      } catch (err) {
        console.warn('Auto-sync cycle error:', err);
      }
    };

    // Run every 25 seconds
    pollTimerRef.current = setInterval(runAutoSync, 25000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isLiveAutoSync, token, spreadsheetId]);

  // Full Club Data bundle
  const getCurrentClubData = (): CompleteClubData => ({
    members,
    matches,
    transactions,
    committee,
    squads,
    documents,
    media,
    profile: clubProfile,
  });

  // Action: Create Official Master Spreadsheet
  const handleCreateMasterSpreadsheet = () => {
    if (!token) {
      handleSignIn();
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: lang === 'si' ? 'Google Drive තුළ නව මාස්ටර් Excel/Sheet ගොනුවක් සෑදීම' : 'Create Master Club Excel / Sheet in Google Drive',
      description:
        lang === 'si'
          ? `ඔබගේ Google Drive ෆෝල්ඩරයේ (${GOOGLE_DRIVE_FOLDER_ID}) සම්පූර්ණ ටැබ් 10 කින් සමන්විත Master Spreadsheet එකක් සාදනු ඇත. තරඟ දින, ක්‍රීඩක ලැයිස්තු, සතිපතා ගෙවීම්, වියදම් සහ විධායක සභාව එකවර සකස් වේ.`
          : `This will create an official 10-tab Master Club Spreadsheet in your designated Google Drive folder (${GOOGLE_DRIVE_FOLDER_ID}) with all matches, member rosters, dues, expenses, squads, and club vision.`,
      actionLabel: lang === 'si' ? 'සෑදීමට තහවුරු කරන්න' : 'Confirm & Create in Drive',
      onConfirm: async () => {
        try {
          setIsSyncing(true);
          setErrorMessage(null);
          const data = getCurrentClubData();
          const created = await createOfficialMasterSpreadsheet(token, data);
          setSpreadsheetId(created.id);
          try {
            localStorage.setItem(DEFAULT_SPREADSHEET_KEY, created.id);
          } catch {}

          try {
            await saveExactCharterCSVToGoogleDrive(token, clubProfile);
            addLog('Uploaded official Young_Star_Sport_Club_Gamudawa.csv charter to Google Drive.');
          } catch (csvErr) {
            console.warn('Could not upload charter CSV alongside master sheet:', csvErr);
          }

          const meta = await fetchSpreadsheetMeta(token, created.id);
          setSpreadsheetMeta(meta);

          const now = new Date().toLocaleTimeString();
          setLastSyncedTime(now);
          setSyncStatusMessage(`✓ Master Sheet & Charter CSV created successfully in Google Drive! (${created.title})`);
          addLog(`Master Sheet created in Drive: ${created.title}`);
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to create Master Spreadsheet');
        } finally {
          setIsSyncing(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Action: Pull ALL Data from Sheet
  const handlePullAllFromSheet = async () => {
    if (!token || !spreadsheetId) {
      setErrorMessage('Please connect to Google and select a valid Google Sheet first.');
      return;
    }

    try {
      setIsSyncing(true);
      setErrorMessage(null);
      setSyncStatusMessage(null);

      const updates = await readAllDataFromMasterSpreadsheet(token, spreadsheetId);
      let updatedModules = 0;

      if (updates.matches && updates.matches.length > 0) {
        setMatches(updates.matches);
        updatedModules++;
      }
      if (updates.members && updates.members.length > 0) {
        setMembers(updates.members);
        updatedModules++;
      }
      if (updates.duesMap && Object.keys(updates.duesMap).length > 0) {
        setMembers((prev) =>
          prev.map((m) => {
            if (updates.duesMap![m.regNumber] !== undefined) {
              return { ...m, weeklyDuesPaidCount: updates.duesMap![m.regNumber] };
            }
            return m;
          })
        );
        updatedModules++;
      }
      if (updates.transactions && updates.transactions.length > 0) {
        setTransactions(updates.transactions);
        updatedModules++;
      }
      if (updates.profile) {
        setClubProfile((prev) => ({ ...prev, ...updates.profile }));
        updatedModules++;
      }

      const now = new Date().toLocaleTimeString();
      setLastSyncedTime(now);
      setSyncStatusMessage(
        lang === 'si'
          ? `✓ Google Sheet එකෙන් සියලුම දත්ත සාර්ථකව යාවත්කාලීන විය! (${updatedModules} අංශ)`
          : `✓ Successfully synced all app details from Google Sheet! (${updatedModules} modules updated)`
      );
      addLog(`Manual pull: ${updatedModules} modules updated from Google Sheet.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to pull data from Google Sheet');
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Push ALL Data to Sheet
  const handlePushAllToSheet = () => {
    if (!token || !spreadsheetId) {
      setErrorMessage('Please connect to Google and select a valid Google Sheet first.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: lang === 'si' ? 'Google Sheet එකට සියලු දත්ත යැවීම' : 'Push All App Data to Google Sheet',
      description:
        lang === 'si'
          ? `මෙමඟින් ක්‍රීඩා සමාජයේ සියලුම අංශ (තරඟ කාලසටහන, ක්‍රීඩකයින්, සතිපතා මුදල්, වියදම් සහ විධායක සභාව) ඔබගේ Google Sheet එකෙහි යාවත්කාලීන කරනු ඇත.`
          : `This will overwrite and update all 10 tabs in your active Google Sheet with the latest app state and dates.`,
      actionLabel: lang === 'si' ? 'යැවීමට තහවුරු කරන්න' : 'Confirm & Push to Sheet',
      onConfirm: async () => {
        try {
          setIsSyncing(true);
          setErrorMessage(null);
          const data = getCurrentClubData();
          await pushAllDataToMasterSpreadsheet(token, spreadsheetId, data);

          const now = new Date().toLocaleTimeString();
          setLastSyncedTime(now);
          setSyncStatusMessage(
            lang === 'si'
              ? '✓ සියලුම ක්‍රීඩා සමාජ දත්ත Google Sheet එකට සාර්ථකව යවන ලදී!'
              : '✓ All app details pushed and synchronized to Google Sheet successfully!'
          );
          addLog('Pushed all 10 modules to Google Sheet.');
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to push data to Google Sheet');
        } finally {
          setIsSyncing(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Action: Export current active tab as CSV for Microsoft Excel
  const handleDownloadActiveTabCSV = () => {
    let filename = `Young_Star_SC_${activeModule}_${new Date().toISOString().split('T')[0]}.csv`;
    let csvData = '';

    if (activeModule === 'matches') {
      const rows = [
        ['Match ID', 'Title', 'Tournament', 'Sport', 'Date', 'Time', 'Venue', 'Status', 'Format', 'Team A', 'Team B', 'Result'],
        ...matches.map((m) => [m.id, m.title, m.tournamentName, m.sport, m.date, m.time, m.venue, m.status, m.matchType, m.teamA.name, m.teamB.name, m.resultSummary || '']),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'payments') {
      const rows = [
        ['Reg Number', 'Full Name', 'Phone', 'Weeks Paid', 'Total Paid (LKR)', 'Current Week', 'Arrears (LKR)', 'Status'],
        ...members.map((m) => {
          const totalPaid = m.weeklyDuesPaidCount * clubProfile.weeklyDuesRate;
          const expected = clubProfile.currentWeek * clubProfile.weeklyDuesRate;
          const arrears = expected - totalPaid;
          return [m.regNumber, m.name, m.phone, m.weeklyDuesPaidCount, totalPaid, clubProfile.currentWeek, arrears, arrears <= 0 ? 'SETTLED' : 'OVERDUE'];
        }),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'expenses') {
      const rows = [
        ['Receipt No', 'Date', 'Payee', 'Category', 'Type', 'Amount (LKR)', 'Payment Method', 'Ref No', 'Notes'],
        ...transactions.map((t) => [t.receiptNumber, t.date, t.memberName, t.category, t.type, t.amount, t.paymentMethod, t.referenceNo, t.notes || '']),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'members') {
      const rows = [
        ['Reg No', 'Name', 'Sinhala Name', 'NIC', 'Phone', 'Address', 'Sports', 'Role', 'Joined Date', 'Status', 'Weeks Paid'],
        ...members.map((m) => [m.regNumber, m.name, m.sinhalaName, m.nic, m.phone, m.address, m.sports.join(', '), m.primaryRole, m.joinedDate, m.status, m.weeklyDuesPaidCount]),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'profile') {
      filename = 'Young_Star_Sport_Club_Gamudawa.csv';
      csvData = generateExactCharterCSVContent(clubProfile);
    } else if (activeModule === 'squads') {
      const rows = [
        ['Squad ID', 'Name', 'Sinhala Name', 'Sport', 'Captain', 'Players Count', 'Jersey Color'],
        ...squads.map((s) => [s.id, s.name, s.sinhalaName, s.sport, s.captainId, s.playerIds.length, s.jerseyColor]),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'committee') {
      const rows = [
        ['Role', 'Sinhala Role', 'Name', 'Phone', 'Email', 'Term', 'Responsibility'],
        ...committee.map((c) => [c.role, c.sinhalaRole, c.name, c.phone, c.email, c.term, c.responsibility]),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'documents') {
      const rows = [
        ['Doc ID', 'Title', 'Category', 'Date', 'Size', 'Description'],
        ...documents.map((d) => [d.id, d.title, d.category, d.date, d.fileSize, d.description]),
      ];
      csvData = gridToCSV(rows);
    } else if (activeModule === 'media') {
      const rows = [
        ['Photo ID', 'Title', 'Album', 'Sport', 'Date', 'URL', 'Caption'],
        ...media.map((m) => [m.id, m.title, m.album, m.sport, m.date, m.url, m.caption]),
      ];
      csvData = gridToCSV(rows);
    }

    if (csvData) {
      downloadCSV(filename, csvData);
      addLog(`Downloaded Excel CSV export for ${activeModule}`);
    }
  };

  // Add Match Handler
  const handleAddNewMatch = () => {
    if (!newMatchTitle.trim()) return;

    const newMatch: MatchScorecard = {
      id: `match-sch-${Date.now()}`,
      title: newMatchTitle.trim(),
      tournamentName: newMatchTournament.trim(),
      sport: newMatchSport,
      date: normalizeSheetDate(newMatchDate, '2026-10-31'),
      time: newMatchTime.trim(),
      venue: newMatchVenue.trim(),
      status: 'upcoming',
      matchType: newMatchSport === 'Cricket' ? 'T20 (20 Overs)' : newMatchSport === 'Volleyball' ? 'Best of 5 Sets' : '90 Mins',
      teamA: {
        id: 'team-1',
        name: 'Young Star SC',
        shortName: 'YSSC',
      },
      teamB: {
        id: `team-opp-${Date.now()}`,
        name: newMatchTeamB.trim(),
        shortName: newMatchTeamB.trim().slice(0, 4).toUpperCase(),
      },
    };

    setMatches((prev) => [newMatch, ...prev]);
    setIsAddMatchModalOpen(false);
    setNewMatchTitle('');

    // If connected to Google Sheet, sync
    if (token && spreadsheetId) {
      syncMatchesToSheet(token, spreadsheetId, [newMatch, ...matches]).catch(console.warn);
      addLog(`Added and synced new match: ${newMatch.title}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Google Drive & Sheets Integration Control Center */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide uppercase">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Drive & Excel Live Synchronization</span>
              {isLiveAutoSync && (
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{lang === 'si' ? 'ගූගල් ෂීට් සහ එක්සෙල් සජීවී කළමනාකරු' : 'Master Excel & Google Sheets Hub'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'si'
                ? 'සියලුම තරඟ දින, ක්‍රීඩක ලැයිස්තු, සතිපතා මුදල් සහ වියදම් Google Drive හි ඇති Excel Sheet එක හරහා සජීවීව සංස්කරණය කරන්න.'
                : 'Edit all club matches, tournament dates, member dues, and financial accounts directly in Google Drive or Excel with two-way real-time sync.'}
            </p>

            {/* Target Google Drive Folder Quick Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drive Folder:</span>
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/60 text-xs font-mono text-amber-300 transition"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{GOOGLE_DRIVE_FOLDER_ID}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              {spreadsheetMeta?.spreadsheetUrl && (
                <a
                  href={spreadsheetMeta.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>
          </div>

          {/* User Account & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {googleUser ? (
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-800/80 border border-slate-700 p-2 sm:px-3 sm:py-2 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google'}
                      className="w-8 h-8 rounded-full border border-emerald-400/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 font-bold text-xs flex items-center justify-center">
                      {googleUser.email?.slice(0, 2).toUpperCase() || 'GS'}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold text-white truncate max-w-[140px]">
                      {googleUser.displayName || googleUser.email?.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      <span>Connected</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign out from Google"
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}

            {/* Master Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCreateMasterSpreadsheet}
                disabled={isSyncing}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition"
                title="Create 10-tab Master Excel in Google Drive"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>{lang === 'si' ? 'Drive තුළ Master Sheet සදන්න' : 'Create Master Sheet in Drive'}</span>
              </button>

              <button
                onClick={handlePullAllFromSheet}
                disabled={isSyncing || !spreadsheetId}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
                title="Pull and update all dates and data from Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{lang === 'si' ? 'Sheet එකෙන් යාවත්කාලීන කරන්න' : 'Sync All From Sheet'}</span>
              </button>

              <button
                onClick={handlePushAllToSheet}
                disabled={isSyncing || !spreadsheetId}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs transition disabled:opacity-40"
                title="Push all app state to Google Sheet"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-300" />
                <span>{lang === 'si' ? 'Sheet එකට යවන්න' : 'Push to Sheet'}</span>
              </button>

              <button
                onClick={handleDownloadActiveTabCSV}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs transition"
                title="Download active tab as CSV for Microsoft Excel"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Excel (.csv)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Status and Notification Banners */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Active Sheet:{' '}
              <strong className="text-white font-mono">{spreadsheetMeta?.title || spreadsheetId || 'Not connected'}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              Last Synced: <strong className="text-emerald-400">{lastSyncedTime}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isLiveAutoSync}
                onChange={(e) => setIsLiveAutoSync(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600"
              />
              <span className="text-xs font-semibold text-slate-300">
                {lang === 'si' ? 'සජීවී ස්වයංක්‍රීය සමමුහුර්තකරණය (25s)' : 'Live Auto-Sync (Every 25s)'}
              </span>
            </label>

            <button
              onClick={() => setIsChangingSheet(!isChangingSheet)}
              className="text-[11px] text-amber-300 hover:text-amber-200 underline font-medium"
            >
              {isChangingSheet ? 'Cancel' : 'Switch Sheet ID'}
            </button>
          </div>
        </div>

        {/* Switch Sheet URL Input Form */}
        {isChangingSheet && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste Google Sheet URL or Spreadsheet ID..."
              value={inputSpreadsheetUrl}
              onChange={(e) => setInputSpreadsheetUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
            <button
              onClick={() => {
                const extracted = extractSpreadsheetId(inputSpreadsheetUrl);
                if (extracted) {
                  setSpreadsheetId(extracted);
                  try {
                    localStorage.setItem(DEFAULT_SPREADSHEET_KEY, extracted);
                  } catch {}
                  setIsChangingSheet(false);
                  addLog(`Switched active spreadsheet ID to ${extracted}`);
                }
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition"
            >
              Link Sheet
            </button>
          </div>
        )}

        {/* Status / Error Toast */}
        {syncStatusMessage && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatusMessage}</span>
            </div>
            <button onClick={() => setSyncStatusMessage(null)} className="text-emerald-400 hover:text-white font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold text-xs">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Module Selector Navigation (All 10 Modules + Custom) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveModule('matches')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'matches'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>📅 Tournaments & Matches ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('live_scorecard')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'live_scorecard'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>🏏 Live Scorecard</span>
        </button>

        <button
          onClick={() => setActiveModule('payments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'payments'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>💰 Weekly Payments (Wk 14)</span>
        </button>

        <button
          onClick={() => setActiveModule('expenses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'expenses'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📊 Expenses & Finances ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('members')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'members'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>👥 Members Roster ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('profile')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>🎯 Vision & Profile</span>
        </button>

        <button
          onClick={() => setActiveModule('squads')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'squads'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>⚡ Squads ({squads.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('committee')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'committee'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>🏛️ Committee ({committee.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('documents')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'documents'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>📁 Documents ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('media')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeModule === 'media'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>📸 Media Gallery ({media.length})</span>
        </button>
      </div>

      {/* Main Interactive Table & Data View Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Module Sub-Header with search & quick actions */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              {activeModule === 'matches' && <Trophy className="w-5 h-5" />}
              {activeModule === 'live_scorecard' && <Activity className="w-5 h-5" />}
              {activeModule === 'payments' && <DollarSign className="w-5 h-5" />}
              {activeModule === 'expenses' && <FileText className="w-5 h-5" />}
              {activeModule === 'members' && <Users className="w-5 h-5" />}
              {activeModule === 'profile' && <Shield className="w-5 h-5" />}
              {activeModule === 'squads' && <Layers className="w-5 h-5" />}
              {activeModule === 'committee' && <Users className="w-5 h-5" />}
              {activeModule === 'documents' && <FileSpreadsheet className="w-5 h-5" />}
              {activeModule === 'media' && <Image className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 capitalize">
                {activeModule.replace('_', ' ')} Tab (Live Excel View)
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'si'
                  ? 'ඕනෑම අගයක් මත ක්ලික් කර සෘජුවම සංස්කරණය කර Google Sheet එකට සුරකින්න.'
                  : 'Click any cell to edit inline, add rows, and sync automatically to Google Sheets.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={sheetSearchQuery}
                onChange={(e) => setSheetSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-56"
              />
            </div>

            {/* Quick Add Row Button based on active module */}
            {activeModule === 'matches' && (
              <button
                onClick={() => setIsAddMatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Match</span>
              </button>
            )}

            {activeModule === 'payments' && (
              <button
                onClick={() => setIsRecordDuesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Dues</span>
              </button>
            )}

            {activeModule === 'expenses' && (
              <button
                onClick={() => setIsRecordExpenseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Transaction</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. TOURNAMENTS & MATCHES TABLE */}
        {activeModule === 'matches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Match Date (SLST)</th>
                  <th className="py-3 px-4">Sport & Format</th>
                  <th className="py-3 px-4">Tournament Title</th>
                  <th className="py-3 px-4">Teams & Scores</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Result / MOM</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches
                  .filter((m) =>
                    !sheetSearchQuery ||
                    m.title.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
                    m.teamB.name.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
                    m.date.includes(sheetSearchQuery)
                  )
                  .map((match) => (
                    <tr key={match.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{match.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">{match.time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{match.sport}</span>
                        <div className="text-[11px] text-slate-500">{match.matchType}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div className="font-bold">{match.title}</div>
                        <div className="text-[11px] text-slate-500">{match.tournamentName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {match.teamA.name}{' '}
                          {match.teamA.runs !== undefined && (
                            <span className="text-amber-600 font-mono">
                              ({match.teamA.runs}/{match.teamA.wickets})
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500">
                          vs {match.teamB.name}{' '}
                          {match.teamB.runs !== undefined && (
                            <span className="text-slate-700 font-mono">
                              ({match.teamB.runs}/{match.teamB.wickets})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{match.venue}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            match.status === 'live'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                              : match.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {match.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {match.resultSummary ? (
                          <div>
                            <div className="font-semibold text-slate-800">{match.resultSummary}</div>
                            {match.manOfTheMatch && (
                              <div className="text-[11px] text-amber-600">MOM: {match.manOfTheMatch}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Fixture scheduled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const newDate = prompt(`Edit Match Date for "${match.title}" (YYYY-MM-DD):`, match.date);
                            if (newDate && newDate !== match.date) {
                              const normalized = normalizeSheetDate(newDate, match.date);
                              setMatches((prev) =>
                                prev.map((m) => (m.id === match.id ? { ...m, date: normalized } : m))
                              );
                              if (token && spreadsheetId) {
                                syncMatchesToSheet(token, spreadsheetId, matches.map((m) => (m.id === match.id ? { ...m, date: normalized } : m))).catch(console.warn);
                              }
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Edit Date
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. LIVE CRICKET SCORECARD TABLE */}
        {activeModule === 'live_scorecard' && (
          <div className="p-6">
            {matches.filter((m) => m.status === 'live').length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold">No active live match in progress right now.</p>
                <p className="text-xs">Schedule or set a fixture to 'live' to sync ball-by-ball updates to Google Sheets.</p>
              </div>
            ) : (
              matches
                .filter((m) => m.status === 'live')
                .map((m) => (
                  <div key={m.id} className="space-y-4">
                    <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">{m.tournamentName}</div>
                        <h3 className="text-xl font-black">{m.title}</h3>
                        <p className="text-xs text-slate-300">{m.venue} · {m.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black font-mono text-amber-400">
                          {m.liveData?.runs ?? m.teamA.runs ?? 142} / {m.liveData?.wickets ?? m.teamA.wickets ?? 3}
                        </div>
                        <div className="text-xs text-slate-300">
                          Overs: {Math.floor((m.liveData?.totalBalls ?? 98) / 6)}.{(m.liveData?.totalBalls ?? 98) % 6} (Target: {m.liveData?.target ?? 169})
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Striker</div>
                        <div className="font-black text-slate-900 text-sm">{m.liveData?.striker.name}</div>
                        <div className="font-mono text-amber-700 font-bold mt-1">
                          {m.liveData?.striker.runs} runs ({m.liveData?.striker.balls}b) · {m.liveData?.striker.fours}x4, {m.liveData?.striker.sixes}x6
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Non-Striker</div>
                        <div className="font-black text-slate-900 text-sm">{m.liveData?.nonStriker.name}</div>
                        <div className="font-mono text-slate-700 font-bold mt-1">
                          {m.liveData?.nonStriker.runs} runs ({m.liveData?.nonStriker.balls}b) · {m.liveData?.nonStriker.fours}x4
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Current Bowler</div>
                        <div className="font-black text-slate-900 text-sm">{m.liveData?.bowler.name}</div>
                        <div className="font-mono text-slate-700 font-bold mt-1">
                          {m.liveData?.bowler.oversConceded} ov, {m.liveData?.bowler.runs}r, {m.liveData?.bowler.wickets}w
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* 3. WEEKLY PAYMENTS TABLE */}
        {activeModule === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Weeks Paid (out of {clubProfile.currentWeek})</th>
                  <th className="py-3 px-4">Total Paid (LKR)</th>
                  <th className="py-3 px-4">Arrears (LKR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members
                  .filter((m) =>
                    !sheetSearchQuery ||
                    m.name.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
                    m.regNumber.toLowerCase().includes(sheetSearchQuery.toLowerCase())
                  )
                  .map((m) => {
                    const totalPaid = m.weeklyDuesPaidCount * clubProfile.weeklyDuesRate;
                    const expected = clubProfile.currentWeek * clubProfile.weeklyDuesRate;
                    const arrears = expected - totalPaid;
                    const isSettled = arrears <= 0;

                    return (
                      <tr key={m.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.regNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-500 font-sinhala">{m.sinhalaName}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{m.phone}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {m.weeklyDuesPaidCount} / {clubProfile.currentWeek}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          LKR {totalPaid.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {isSettled ? (
                            <span className="text-emerald-600">Settled</span>
                          ) : (
                            <span className="text-rose-600">LKR {arrears.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isSettled
                                ? 'bg-emerald-100 text-emerald-800'
                                : arrears <= 200
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isSettled ? 'SETTLED' : arrears <= 200 ? 'PENDING' : 'OVERDUE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              onUpdateMemberDues(m.id, 1);
                              addLog(`Recorded +1 week dues for ${m.name}`);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 transition"
                          >
                            +1 Wk (LKR 100)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. EXPENSES & FINANCES TABLE */}
        {activeModule === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Receipt / Voucher</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payee / Entity</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount (LKR)</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter((t) =>
                    !sheetSearchQuery ||
                    t.memberName.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
                    t.receiptNumber.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
                    t.date.includes(sheetSearchQuery)
                  )
                  .map((tx) => (
                    <tr key={tx.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{tx.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.memberName}</td>
                      <td className="py-3 px-4 text-slate-600 capitalize">{tx.type.replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.category === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-mono font-bold ${tx.category === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {tx.category === 'income' ? '+' : '-'} LKR {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.paymentMethod}
                        <div className="text-[10px] text-slate-400 font-mono">{tx.referenceNo}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{tx.recordedBy}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. MEMBERS ROSTER TABLE */}
        {activeModule === 'members' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">NIC</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Sports & Role</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members
                  .filter((m) =>
                    !sheetSearchQuery ||
                    m.name.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
                    m.regNumber.toLowerCase().includes(sheetSearchQuery.toLowerCase())
                  )
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.regNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-500">{m.sinhalaName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.nic}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.phone}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{m.sports.join(', ')}</div>
                        <div className="text-[11px] text-slate-500">{m.primaryRole}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.joinedDate}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. CLUB PROFILE & VISION (EXCEL-STYLE EDITABLE SPREADSHEET & CARDS) */}
        {activeModule === 'profile' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Profile Action Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileViewMode('excel')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    profileViewMode === 'excel'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel Grid Editor</span>
                </button>
                <button
                  onClick={() => setProfileViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    profileViewMode === 'cards'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Charter Summary Cards</span>
                </button>
              </div>

              {/* Action Buttons: Save to Drive, Download, Import */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={profileFileInputRef}
                  accept=".csv"
                  onChange={handleImportCharterCSV}
                  className="hidden"
                />

                <button
                  onClick={() => profileFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition"
                  title="Upload an edited CSV file from Excel to update app profile"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>Import CSV</span>
                </button>

                <button
                  onClick={handleDownloadActiveTabCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition"
                  title="Download Young_Star_Sport_Club_Gamudawa.csv for Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Excel CSV</span>
                </button>

                <button
                  onClick={handleSaveCharterCSVToDrive}
                  disabled={isSavingCharterToDrive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                  title="Save Young_Star_Sport_Club_Gamudawa.csv directly into Google Drive folder"
                >
                  {isSavingCharterToDrive ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5" />
                  )}
                  <span>Save CSV to Drive</span>
                </button>

                <button
                  onClick={handleSaveProfileChanges}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-sm transition disabled:opacity-50"
                  title="Save changes and sync to Google Sheets tab"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Sync</span>
                </button>
              </div>
            </div>

            {profileViewMode === 'excel' ? (
              /* Excel-Style Grid Spreadsheet Editor */
              <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="bg-emerald-800 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Microsoft Excel / Google Sheets Live Grid Editor · [Tab: Club Profile & Vision]</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-200">12 Rows × 4 Columns</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-mono text-[11px]">
                        <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200 bg-slate-200/70">#</th>
                        <th className="py-2.5 px-4 w-48 border-r border-slate-200 font-bold">A · Parameter</th>
                        <th className="py-2.5 px-4 border-r border-slate-200 font-bold">B · English Value (Editable)</th>
                        <th className="py-2.5 px-4 border-r border-slate-200 font-bold">C · සිංහල අගය (Editable)</th>
                        <th className="py-2.5 px-4 w-52 font-bold text-slate-500">D · Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-xs">
                      {/* Row 1: Club Name */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">1</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">Club Name</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={clubProfile.clubNameEn}
                            onChange={(e) => setClubProfile({ ...clubProfile, clubNameEn: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={clubProfile.clubNameSi}
                            onChange={(e) => setClubProfile({ ...clubProfile, clubNameSi: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Official registered club title</td>
                      </tr>

                      {/* Row 2: Reg Number */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">2</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">Registration No</td>
                        <td className="py-1 px-2 border-r border-slate-200" colSpan={2}>
                          <input
                            type="text"
                            value={clubProfile.regNumber}
                            onChange={(e) => setClubProfile({ ...clubProfile, regNumber: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-mono text-xs text-slate-900 font-bold"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Divisional Secretariat Registration</td>
                      </tr>

                      {/* Row 3: Home Grounds */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">3</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">Home Ground</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={clubProfile.homeGroundEn}
                            onChange={(e) => setClubProfile({ ...clubProfile, homeGroundEn: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={clubProfile.homeGroundSi}
                            onChange={(e) => setClubProfile({ ...clubProfile, homeGroundSi: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Primary match and training ground</td>
                      </tr>

                      {/* Row 4: Official Email & Phone */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">4</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">Email & Phone</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={clubProfile.email}
                            onChange={(e) => setClubProfile({ ...clubProfile, email: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-mono text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <input
                            type="text"
                            value={clubProfile.phone}
                            onChange={(e) => setClubProfile({ ...clubProfile, phone: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-mono text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Official communication channels</td>
                      </tr>

                      {/* Row 5: 🎯 Vision */}
                      <tr className="hover:bg-amber-50/30 transition bg-amber-50/20">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400 font-bold">5</td>
                        <td className="py-2 px-4 font-black text-amber-800 border-r border-slate-200 flex items-center gap-1.5">
                          <span>🎯 Vision</span>
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={3}
                            value={clubProfile.visionEn}
                            onChange={(e) => setClubProfile({ ...clubProfile, visionEn: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900 leading-relaxed"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={3}
                            value={clubProfile.visionSi}
                            onChange={(e) => setClubProfile({ ...clubProfile, visionSi: e.target.value })}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900 leading-relaxed"
                          />
                        </td>
                        <td className="py-2 px-4 text-amber-700 text-[11px] font-sans">Core vision from official charter</td>
                      </tr>

                      {/* Row 6: 🚀 Mission Pillar 1 */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">6</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">💪 Mission Pillar 1</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionEn[0] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionEn];
                              updated[0] = e.target.value;
                              setClubProfile({ ...clubProfile, missionEn: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionSi[0] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionSi];
                              updated[0] = e.target.value;
                              setClubProfile({ ...clubProfile, missionSi: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Talent development & leadership</td>
                      </tr>

                      {/* Row 7: 🚀 Mission Pillar 2 */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">7</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">💪 Mission Pillar 2</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionEn[1] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionEn];
                              updated[1] = e.target.value;
                              setClubProfile({ ...clubProfile, missionEn: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionSi[1] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionSi];
                              updated[1] = e.target.value;
                              setClubProfile({ ...clubProfile, missionSi: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Brotherhood & mutual community respect</td>
                      </tr>

                      {/* Row 8: 🚀 Mission Pillar 3 */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">8</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">💪 Mission Pillar 3</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionEn[2] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionEn];
                              updated[2] = e.target.value;
                              setClubProfile({ ...clubProfile, missionEn: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionSi[2] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionSi];
                              updated[2] = e.target.value;
                              setClubProfile({ ...clubProfile, missionSi: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Health, fitness & drug-free active living</td>
                      </tr>

                      {/* Row 9: 🚀 Mission Pillar 4 */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">9</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">💪 Mission Pillar 4</td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionEn[3] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionEn];
                              updated[3] = e.target.value;
                              setClubProfile({ ...clubProfile, missionEn: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sans text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200">
                          <textarea
                            rows={2}
                            value={clubProfile.missionSi[3] || ''}
                            onChange={(e) => {
                              const updated = [...clubProfile.missionSi];
                              updated[3] = e.target.value;
                              setClubProfile({ ...clubProfile, missionSi: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-sinhala text-xs text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Tournaments & sports infrastructure</td>
                      </tr>

                      {/* Row 10: Weekly Dues Rate */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">10</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">Weekly Dues Rate (LKR)</td>
                        <td className="py-1 px-2 border-r border-slate-200" colSpan={2}>
                          <input
                            type="number"
                            value={clubProfile.weeklyDuesRate}
                            onChange={(e) => setClubProfile({ ...clubProfile, weeklyDuesRate: parseFloat(e.target.value) || 0 })}
                            className="w-48 px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-mono text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Default LKR 100 per week contribution</td>
                      </tr>

                      {/* Row 11: Current Week */}
                      <tr className="hover:bg-amber-50/30 transition">
                        <td className="py-2 px-3 text-center bg-slate-50 border-r border-slate-200 text-slate-400">11</td>
                        <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">Current Active Week</td>
                        <td className="py-1 px-2 border-r border-slate-200" colSpan={2}>
                          <input
                            type="number"
                            value={clubProfile.currentWeek}
                            onChange={(e) => setClubProfile({ ...clubProfile, currentWeek: parseInt(e.target.value, 10) || 1 })}
                            className="w-48 px-2 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white bg-slate-50/50 font-mono text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-4 text-slate-500 text-[11px] font-sans">Current active week index (e.g. 14)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Presentation Cards View */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Club Official Details</span>
                    <div className="text-lg font-black text-slate-900">{clubProfile.clubNameEn}</div>
                    <div className="text-xs text-slate-600 font-sinhala">{clubProfile.clubNameSi}</div>
                    <div className="text-xs text-slate-500 pt-2 space-y-1">
                      <div>Govt Reg: <strong className="text-slate-800 font-mono">{clubProfile.regNumber}</strong></div>
                      <div>Home Grounds: <strong className="text-slate-800">{clubProfile.homeGroundEn}</strong></div>
                      <div>Official Email: <strong className="text-slate-800">{clubProfile.email}</strong></div>
                      <div>Contact Phone: <strong className="text-slate-800">{clubProfile.phone}</strong></div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">🎯 Official Vision</span>
                    <p className="text-xs text-slate-800 font-medium italic">"{clubProfile.visionEn}"</p>
                    <p className="text-xs text-slate-700 font-sinhala italic pt-1">"{clubProfile.visionSi}"</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">🚀 Official Mission (4 Pillars)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clubProfile.missionEn.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                          <span>💪</span>
                          <span>Pillar {idx + 1}: {m}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-sinhala pl-5">{clubProfile.missionSi[idx]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. TEAMS & SQUADS TABLE */}
        {activeModule === 'squads' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Squad Name</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Captain</th>
                  <th className="py-3 px-4">Player Count</th>
                  <th className="py-3 px-4">Jersey Color</th>
                  <th className="py-3 px-4">Coach / Mentor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {squads.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.sinhalaName}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">{s.sport}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{s.captainId}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.playerIds.length} Athletes</td>
                    <td className="py-3 px-4 text-slate-600">{s.jerseyColor}</td>
                    <td className="py-3 px-4 text-slate-600">{s.coachName || 'Executive Committee'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. EXECUTIVE COMMITTEE TABLE */}
        {activeModule === 'committee' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Official Email</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Responsibilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {committee.map((c) => (
                  <tr key={c.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.role}</div>
                      <div className="text-[11px] text-slate-500 font-sinhala">{c.sinhalaRole}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.phone}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.email}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{c.term}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">{c.responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. DOCUMENTS TABLE */}
        {activeModule === 'documents' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Doc Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-[11px] text-slate-500 font-sinhala">{d.sinhalaTitle}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{d.category}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{d.date}</td>
                    <td className="py-3 px-4 text-slate-500">{d.fileSize}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">{d.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 10. MEDIA GALLERY TABLE */}
        {activeModule === 'media' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">Photo Title</th>
                  <th className="py-3 px-4">Album</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Capture Date</th>
                  <th className="py-3 px-4">Photographer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {media.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-3 px-4">
                      <img src={m.url} alt={m.title} className="w-12 h-10 object-cover rounded-lg shadow-sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{m.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{m.caption}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{m.album}</td>
                    <td className="py-3 px-4 font-semibold text-amber-600">{m.sport}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{m.date}</td>
                    <td className="py-3 px-4 text-slate-500">{m.photographer || 'Club Archive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real-time Activity Log */}
      {activityLog.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs font-mono space-y-1.5 shadow-md border border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Live Real-Time Activity Log</span>
            </span>
            <button onClick={() => setActivityLog([])} className="text-slate-500 hover:text-slate-300">
              Clear
            </button>
          </div>
          {activityLog.slice(0, 5).map((log, i) => (
            <div key={i} className="text-slate-400 text-[11px]">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Match Modal */}
      {isAddMatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Schedule New Match / Fixture</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Match Title</label>
                <input
                  type="text"
                  value={newMatchTitle}
                  onChange={(e) => setNewMatchTitle(e.target.value)}
                  placeholder="e.g. Gamudawa Trophy Semi-Final"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={newMatchSport}
                    onChange={(e) => setNewMatchSport(e.target.value as SportType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Football">Football</option>
                    <option value="Carrom">Carrom</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Match Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time (SLST)</label>
                  <input
                    type="text"
                    value={newMatchTime}
                    onChange={(e) => setNewMatchTime(e.target.value)}
                    placeholder="02:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opponent Team</label>
                  <input
                    type="text"
                    value={newMatchTeamB}
                    onChange={(e) => setNewMatchTeamB(e.target.value)}
                    placeholder="Opponent Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Venue</label>
                <input
                  type="text"
                  value={newMatchVenue}
                  onChange={(e) => setNewMatchVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddMatchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewMatch}
                disabled={!newMatchTitle.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-40"
              >
                Add & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Dues Modal */}
      {isRecordDuesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Record Weekly Dues Payment</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Member</label>
                <select
                  value={duesMemberId}
                  onChange={(e) => setDuesMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.regNumber} - {m.name} ({m.weeklyDuesPaidCount}/{clubProfile.currentWeek} paid)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Number of Weeks (LKR 100 / Week)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={duesWeeks}
                  onChange={(e) => setDuesWeeks(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-emerald-700 font-bold mt-1">
                  Total Amount: LKR {(duesWeeks * clubProfile.weeklyDuesRate).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRecordDuesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateMemberDues(duesMemberId, duesWeeks);
                  const mem = members.find((m) => m.id === duesMemberId);
                  if (mem) {
                    onAddTransaction({
                      id: `tx-dues-${Date.now()}`,
                      receiptNumber: `YSSC-RCPT-2026-${Math.floor(100 + Math.random() * 900)}`,
                      date: new Date().toISOString().split('T')[0],
                      memberId: mem.id,
                      memberName: mem.name,
                      category: 'income',
                      type: 'weekly_dues',
                      amount: duesWeeks * clubProfile.weeklyDuesRate,
                      paymentMethod: 'Google Sheet Sync',
                      referenceNo: `GSHEET-DUE-${duesWeeks}W`,
                      year: 2026,
                      recordedBy: googleUser?.displayName || 'Treasurer (Google Sheet Sync)',
                      notes: `Paid ${duesWeeks} weeks membership fee`,
                    });
                  }
                  setIsRecordDuesModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition"
              >
                Save & Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isRecordExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Record Transaction</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payee / Entity</label>
                <input
                  type="text"
                  placeholder="e.g. Dambulla Sports Goods, Ground Maintenance"
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (LKR)</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Leather balls, pitch maintenance"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRecordExpenseModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(expAmount) || 0;
                  if (amt > 0 && expName.trim()) {
                    onAddTransaction({
                      id: `tx-exp-${Date.now()}`,
                      receiptNumber: `YSSC-${expCategory === 'income' ? 'RCPT' : 'VCH'}-2026-${Math.floor(100 + Math.random() * 900)}`,
                      date: new Date().toISOString().split('T')[0],
                      memberName: expName.trim(),
                      category: expCategory,
                      type: expType,
                      amount: amt,
                      paymentMethod: expMethod,
                      referenceNo: `REF-${Date.now().toString().slice(-4)}`,
                      year: 2026,
                      recordedBy: googleUser?.displayName || 'Club Official',
                      notes: expNotes.trim(),
                    });
                    setIsRecordExpenseModalOpen(false);
                    setExpName('');
                  }
                }}
                disabled={!expName.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition disabled:opacity-40"
              >
                Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL for Google Drive / Sheets Mutations */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500">Google Drive & Workspace Authorization</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
              >
                {lang === 'si' ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg transition"
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
