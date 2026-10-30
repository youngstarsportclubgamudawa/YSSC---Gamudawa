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
import { GOOGLE_DRIVE_FOLDER_ID } from './googleDriveService';
import { normalizeSheetDate } from '../utils/dateUtils';

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface LiveSpreadsheetMeta {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTabInfo[];
}

export interface CustomSheetData {
  title: string;
  sheetId: number;
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export const MASTER_SHEET_TABS = [
  'Tournaments & Matches',
  'Live Cricket Scorecard',
  'Weekly Membership Payments',
  'Expenses & Finances',
  'Members Roster',
  'Club Profile & Vision',
  'Teams & Squads',
  'Executive Committee',
  'Club Documents',
  'Media Gallery',
] as const;

/**
 * Extracts a Google Spreadsheet ID from either:
 * - A full Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n.../edit)
 * - A raw spreadsheet ID
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed.split('/')[0].split('?')[0];
}

/**
 * Fetches spreadsheet metadata including all sheet tabs dynamically.
 */
export async function fetchSpreadsheetMeta(
  accessToken: string,
  spreadsheetId: string
): Promise<LiveSpreadsheetMeta> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet metadata (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const sheets: SheetTabInfo[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
    rowCount: s.properties.gridProperties?.rowCount,
    columnCount: s.properties.gridProperties?.columnCount,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Young Star SC Google Sheet',
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

/**
 * Fetches values for a given sheet title / range.
 */
export async function fetchSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  range: string = 'A1:Z500'
): Promise<any[][]> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch values from '${sheetTitle}' (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Fetches full sheet data (headers + rows) for dynamic sheet tabs.
 */
export async function fetchSheetGridData(
  accessToken: string,
  spreadsheetId: string,
  tab: SheetTabInfo
): Promise<CustomSheetData> {
  const values = await fetchSheetValues(accessToken, spreadsheetId, tab.title, 'A1:Z300');
  const headers: string[] = (values[0] || []).map((h: any, idx: number) => String(h || `Column ${idx + 1}`));
  const rows = values.slice(1);

  return {
    title: tab.title,
    sheetId: tab.sheetId,
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
}

/**
 * Adds a new sheet tab to the spreadsheet if it does not already exist.
 */
export async function ensureSheetTabExists(
  accessToken: string,
  spreadsheetId: string,
  title: string
): Promise<void> {
  const meta = await fetchSpreadsheetMeta(accessToken, spreadsheetId);
  const exists = meta.sheets.some((s) => s.title.toLowerCase() === title.toLowerCase());
  if (exists) return;

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title,
              gridProperties: {
                rowCount: 100,
                columnCount: 16,
              },
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create sheet tab '${title}': ${errorText}`);
  }
}

/**
 * Overwrites values in a specified range with USER_ENTERED format.
 */
export async function updateSheetRange(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  range: string,
  values: any[][]
): Promise<void> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update '${sheetTitle}'!${range}: ${errorText}`);
  }
}

/**
 * Appends a row to a sheet tab in real-time.
 */
export async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowValues: any[]
): Promise<void> {
  const encodedRange = encodeURIComponent(`'${sheetTitle}'!A:A`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [rowValues] }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to append row to '${sheetTitle}': ${errorText}`);
  }
}

// ============================================================================
// 1. TOURNAMENTS & MATCHES (Full Fixtures & Date Tracking)
// ============================================================================
export async function syncMatchesToSheet(
  accessToken: string,
  spreadsheetId: string,
  matches: MatchScorecard[]
): Promise<void> {
  const sheetTitle = 'Tournaments & Matches';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Match ID',
    'Match Title',
    'Tournament Name',
    'Sport',
    'Match Date (YYYY-MM-DD)',
    'Time (SLST)',
    'Venue',
    'Status (upcoming / live / completed)',
    'Format',
    'Team A Name',
    'Team A Score',
    'Team B Name',
    'Team B Score',
    'Result Summary',
    'Man of the Match',
    'Last Synced',
  ];

  const now = new Date().toLocaleString();
  const dataRows = matches.map((m) => {
    const scoreA = m.teamA.runs !== undefined ? `${m.teamA.runs}/${m.teamA.wickets ?? 0} (${m.teamA.overs ?? 0} ov)` : m.teamA.points !== undefined ? `${m.teamA.points} pts` : '-';
    const scoreB = m.teamB.runs !== undefined ? `${m.teamB.runs}/${m.teamB.wickets ?? 0} (${m.teamB.overs ?? 0} ov)` : m.teamB.points !== undefined ? `${m.teamB.points} pts` : '-';
    return [
      m.id,
      m.title,
      m.tournamentName,
      m.sport,
      m.date,
      m.time,
      m.venue,
      m.status,
      m.matchType,
      m.teamA.name,
      scoreA,
      m.teamB.name,
      scoreB,
      m.resultSummary || '',
      m.manOfTheMatch || '',
      now,
    ];
  });

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:P${fullGrid.length}`,
    fullGrid
  );
}

export async function readMatchesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<MatchScorecard[]> {
  const sheetTitle = 'Tournaments & Matches';
  try {
    const rows = await fetchSheetValues(accessToken, spreadsheetId, sheetTitle, 'A1:P200');
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
    const idIdx = headers.findIndex((h: string) => h.includes('match id') || h === 'id');
    const titleIdx = headers.findIndex((h: string) => h.includes('title'));
    const tourneyIdx = headers.findIndex((h: string) => h.includes('tournament'));
    const sportIdx = headers.findIndex((h: string) => h.includes('sport'));
    const dateIdx = headers.findIndex((h: string) => h.includes('date'));
    const timeIdx = headers.findIndex((h: string) => h.includes('time'));
    const venueIdx = headers.findIndex((h: string) => h.includes('venue'));
    const statusIdx = headers.findIndex((h: string) => h.includes('status'));
    const formatIdx = headers.findIndex((h: string) => h.includes('format'));
    const teamAIdx = headers.findIndex((h: string) => h.includes('team a name') || h === 'team a');
    const teamAScoreIdx = headers.findIndex((h: string) => h.includes('team a score'));
    const teamBIdx = headers.findIndex((h: string) => h.includes('team b name') || h === 'team b');
    const teamBScoreIdx = headers.findIndex((h: string) => h.includes('team b score'));
    const resultIdx = headers.findIndex((h: string) => h.includes('result'));
    const momIdx = headers.findIndex((h: string) => h.includes('man of the match') || h.includes('mom'));

    const parsed: MatchScorecard[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const title = String(row[titleIdx] || '').trim();
      if (!title) continue;

      const id = String(row[idIdx] || `match-sheet-${i}`).trim();
      const rawDate = row[dateIdx];
      const matchDate = normalizeSheetDate(rawDate, '2026-10-27');
      const sport = (String(row[sportIdx] || 'Cricket').trim() as SportType) || 'Cricket';
      const statusRaw = String(row[statusIdx] || 'upcoming').toLowerCase().trim();
      const status: MatchScorecard['status'] = statusRaw.includes('live')
        ? 'live'
        : statusRaw.includes('comp')
        ? 'completed'
        : 'upcoming';

      const teamAName = String(row[teamAIdx] || 'Young Star SC').trim();
      const teamBName = String(row[teamBIdx] || 'Opponent').trim();

      // Parse score approximations if available
      const scoreAText = String(row[teamAScoreIdx] || '');
      const scoreBText = String(row[teamBScoreIdx] || '');

      let runsA: number | undefined;
      let wicketsA: number | undefined;
      let oversA: string | undefined;
      const cricketAMatch = scoreAText.match(/(\d+)\/(\d+)\s*\(([\d.]+)/);
      if (cricketAMatch) {
        runsA = parseInt(cricketAMatch[1], 10);
        wicketsA = parseInt(cricketAMatch[2], 10);
        oversA = cricketAMatch[3];
      }

      let runsB: number | undefined;
      let wicketsB: number | undefined;
      let oversB: string | undefined;
      const cricketBMatch = scoreBText.match(/(\d+)\/(\d+)\s*\(([\d.]+)/);
      if (cricketBMatch) {
        runsB = parseInt(cricketBMatch[1], 10);
        wicketsB = parseInt(cricketBMatch[2], 10);
        oversB = cricketBMatch[3];
      }

      parsed.push({
        id,
        title,
        tournamentName: String(row[tourneyIdx] || 'Young Star Championship 2026').trim(),
        sport,
        date: matchDate,
        time: String(row[timeIdx] || '03:00 PM').trim(),
        venue: String(row[venueIdx] || 'Gamudawa Mahinda Rajapaksa Ground').trim(),
        status,
        matchType: String(row[formatIdx] || 'T20 (20 Overs)').trim(),
        teamA: {
          id: 'team-1',
          name: teamAName,
          shortName: teamAName.split(' ')[0],
          runs: runsA,
          wickets: wicketsA,
          overs: oversA,
        },
        teamB: {
          id: `team-opp-${i}`,
          name: teamBName,
          shortName: teamBName.split(' ')[0],
          runs: runsB,
          wickets: wicketsB,
          overs: oversB,
        },
        resultSummary: String(row[resultIdx] || '').trim(),
        manOfTheMatch: String(row[momIdx] || '').trim(),
      });
    }

    return parsed;
  } catch (err) {
    console.warn(`Could not read '${sheetTitle}':`, err);
    return [];
  }
}

// ============================================================================
// 2. LIVE CRICKET SCORECARD
// ============================================================================
export async function syncLiveScorecardToSheet(
  accessToken: string,
  spreadsheetId: string,
  liveMatch: MatchScorecard
): Promise<void> {
  const sheetTitle = 'Live Cricket Scorecard';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Attribute / Metric',
    'Live Value',
    'Description',
    'Last Synced (Real-Time)',
  ];

  const ld = liveMatch.liveData;
  const now = new Date().toLocaleString();
  const rows = [
    ['Match ID & Title', `${liveMatch.id} - ${liveMatch.title}`, 'Active fixture', now],
    ['Tournament', liveMatch.tournamentName, 'Competition', now],
    ['Match Status', liveMatch.status.toUpperCase(), 'Current play status', now],
    ['Batting Team', liveMatch.currentBattingTeam === 'teamA' ? liveMatch.teamA.name : liveMatch.teamB.name, 'Side currently batting', now],
    ['Score / Wickets', `${ld?.runs ?? liveMatch.teamA.runs ?? 0} / ${ld?.wickets ?? liveMatch.teamA.wickets ?? 0}`, 'Current innings tally', now],
    ['Overs Bowled', `${Math.floor((ld?.totalBalls ?? 98) / 6)}.${(ld?.totalBalls ?? 98) % 6}`, 'Total legal deliveries', now],
    ['Target Score', ld?.target ? String(ld.target) : 'First Innings Setting', 'Target runs to win', now],
    ['Striker Batsman', `${ld?.striker.name ?? 'Charith Jayasuriya (c)'} - ${ld?.striker.runs ?? 58}* (${ld?.striker.balls ?? 38}b, 4s: ${ld?.striker.fours ?? 6}, 6s: ${ld?.striker.sixes ?? 3})`, 'Facing delivery', now],
    ['Non-Striker', `${ld?.nonStriker.name ?? 'Kasun Dananjaya'} - ${ld?.nonStriker.runs ?? 42}* (${ld?.nonStriker.balls ?? 31}b, 4s: ${ld?.nonStriker.fours ?? 4}, 6s: ${ld?.nonStriker.sixes ?? 1})`, 'Runner partner', now],
    ['Current Bowler', `${ld?.bowler.name ?? 'K. Madushanka'} (${ld?.bowler.oversConceded ?? '3.2'} ov, ${ld?.bowler.runs ?? 28}r, ${ld?.bowler.wickets ?? 1}w)`, 'Active bowler', now],
    ['Current Over Balls', (ld?.currentOverBalls || ['1', '4', '0', '6']).join('  |  '), 'Ball-by-ball sequence', now],
    ['Match Equation', liveMatch.resultSummary || 'Match in progress', 'Result requirement', now],
  ];

  const fullGrid = [headerRow, ...rows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:D${fullGrid.length}`,
    fullGrid
  );
}

// ============================================================================
// 3. WEEKLY MEMBERSHIP PAYMENTS
// ============================================================================
export async function syncWeeklyPaymentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  members: Member[],
  currentWeek: number = 14,
  weeklyRate: number = 100
): Promise<void> {
  const sheetTitle = 'Weekly Membership Payments';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Reg Number',
    'Full Name',
    'Sinhala Name',
    'Primary Sport & Role',
    'Phone',
    'Weeks Paid (out of 14)',
    'Total Paid (LKR)',
    'Current Week',
    'Arrears (LKR)',
    'Status',
    'Notes / Remarks',
    'Last Synced At',
  ];

  const now = new Date().toLocaleString();
  const dataRows = members.map((m) => {
    const totalPaid = m.weeklyDuesPaidCount * weeklyRate;
    const expected = currentWeek * weeklyRate;
    const arrears = expected - totalPaid;
    const status = arrears <= 0 ? 'SETTLED' : arrears <= 200 ? 'PENDING' : 'OVERDUE';
    return [
      m.regNumber,
      m.name,
      m.sinhalaName,
      `${m.sports.join(', ')} - ${m.primaryRole}`,
      m.phone,
      m.weeklyDuesPaidCount,
      totalPaid,
      currentWeek,
      arrears,
      status,
      m.duesNotes || '',
      now,
    ];
  });

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:L${fullGrid.length}`,
    fullGrid
  );
}

export async function readWeeklyPaymentsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Record<string, number>> {
  const sheetTitle = 'Weekly Membership Payments';
  try {
    const rows = await fetchSheetValues(accessToken, spreadsheetId, sheetTitle, 'A1:L150');
    if (!rows || rows.length < 2) return {};

    const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
    const regIndex = headers.findIndex((h: string) => h.includes('reg'));
    const weeksPaidIndex = headers.findIndex((h: string) => h.includes('weeks paid'));

    if (regIndex === -1 || weeksPaidIndex === -1) return {};

    const duesMap: Record<string, number> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const reg = String(row[regIndex] || '').trim();
      const weeksPaid = parseInt(row[weeksPaidIndex], 10);
      if (reg && !isNaN(weeksPaid)) {
        duesMap[reg] = weeksPaid;
      }
    }
    return duesMap;
  } catch (err) {
    console.warn(`Could not read '${sheetTitle}' values:`, err);
    return {};
  }
}

// ============================================================================
// 4. EXPENSES & FINANCES
// ============================================================================
export async function syncExpensesToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: FinancialTransaction[]
): Promise<void> {
  const sheetTitle = 'Expenses & Finances';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Receipt Number',
    'Date (YYYY-MM-DD)',
    'Entity / Member / Payee',
    'Category (INCOME / EXPENSE)',
    'Transaction Type',
    'Amount (LKR)',
    'Payment Method',
    'Reference No',
    'Recorded By',
    'Notes',
    'Sync Timestamp',
  ];

  const now = new Date().toLocaleString();
  const dataRows = transactions.map((t) => [
    t.receiptNumber,
    t.date,
    t.memberName,
    t.category.toUpperCase(),
    t.type.replace('_', ' ').toUpperCase(),
    t.amount,
    t.paymentMethod,
    t.referenceNo,
    t.recordedBy,
    t.notes || '',
    now,
  ]);

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:K${fullGrid.length}`,
    fullGrid
  );
}

export async function readExpensesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<FinancialTransaction[]> {
  const sheetTitle = 'Expenses & Finances';
  try {
    const rows = await fetchSheetValues(accessToken, spreadsheetId, sheetTitle, 'A1:K300');
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
    const rcptIdx = headers.findIndex((h: string) => h.includes('receipt'));
    const dateIdx = headers.findIndex((h: string) => h.includes('date'));
    const nameIdx = headers.findIndex((h: string) => h.includes('member') || h.includes('entity') || h.includes('payee'));
    const catIdx = headers.findIndex((h: string) => h.includes('category'));
    const typeIdx = headers.findIndex((h: string) => h.includes('type'));
    const amtIdx = headers.findIndex((h: string) => h.includes('amount'));
    const methodIdx = headers.findIndex((h: string) => h.includes('method'));
    const refIdx = headers.findIndex((h: string) => h.includes('ref'));
    const recByIdx = headers.findIndex((h: string) => h.includes('recorded'));
    const notesIdx = headers.findIndex((h: string) => h.includes('note'));

    const parsed: FinancialTransaction[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const amount = parseFloat(row[amtIdx]) || 0;
      if (amount <= 0) continue;

      const category = String(row[catIdx] || '').toLowerCase().includes('expense') ? 'expense' : 'income';
      const receiptNumber = String(row[rcptIdx] || `GSHEET-TX-${i}`);
      const rawDate = row[dateIdx];
      const parsedDate = normalizeSheetDate(rawDate, '2026-10-27');

      parsed.push({
        id: `gsheet-tx-${receiptNumber}`,
        receiptNumber,
        date: parsedDate,
        memberName: String(row[nameIdx] || 'General Club Transaction'),
        category,
        type: String(row[typeIdx] || 'weekly_dues').toLowerCase().includes('dues') ? 'weekly_dues' : 'equipment_expense',
        amount,
        paymentMethod: (row[methodIdx] as any) || 'Google Sheet Sync',
        referenceNo: String(row[refIdx] || `REF-${i}`),
        year: 2026,
        recordedBy: String(row[recByIdx] || 'Google Sheet User'),
        notes: String(row[notesIdx] || ''),
      });
    }

    return parsed;
  } catch (err) {
    console.warn(`Could not read '${sheetTitle}' values:`, err);
    return [];
  }
}

// ============================================================================
// 5. MEMBERS ROSTER
// ============================================================================
export async function syncMembersToSheet(
  accessToken: string,
  spreadsheetId: string,
  members: Member[]
): Promise<void> {
  const sheetTitle = 'Members Roster';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Reg Number',
    'Full Name',
    'Sinhala Name',
    'NIC Number',
    'Phone',
    'Address',
    'Sports',
    'Primary Role',
    'Jersey No',
    'Joined Date (YYYY-MM-DD)',
    'Status (Active / Inactive / Honorary)',
    'Total Weeks Paid',
    'Emergency Contact',
    'Emergency Phone',
  ];

  const dataRows = members.map((m) => [
    m.regNumber,
    m.name,
    m.sinhalaName,
    m.nic,
    m.phone,
    m.address,
    m.sports.join(', '),
    m.primaryRole,
    m.jerseyNumber || '',
    m.joinedDate,
    m.status,
    m.weeklyDuesPaidCount,
    m.emergencyContact?.name || '',
    m.emergencyContact?.phone || '',
  ]);

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:N${fullGrid.length}`,
    fullGrid
  );
}

export async function readMembersFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Member[]> {
  const sheetTitle = 'Members Roster';
  try {
    const rows = await fetchSheetValues(accessToken, spreadsheetId, sheetTitle, 'A1:N200');
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
    const regIdx = headers.findIndex((h: string) => h.includes('reg'));
    const nameIdx = headers.findIndex((h: string) => h.includes('full name') || h === 'name');
    const sinNameIdx = headers.findIndex((h: string) => h.includes('sinhala'));
    const nicIdx = headers.findIndex((h: string) => h.includes('nic'));
    const phoneIdx = headers.findIndex((h: string) => h.includes('phone'));
    const addrIdx = headers.findIndex((h: string) => h.includes('address'));
    const sportsIdx = headers.findIndex((h: string) => h.includes('sport'));
    const roleIdx = headers.findIndex((h: string) => h.includes('role'));
    const jerseyIdx = headers.findIndex((h: string) => h.includes('jersey'));
    const joinedIdx = headers.findIndex((h: string) => h.includes('joined'));
    const statusIdx = headers.findIndex((h: string) => h.includes('status'));
    const duesIdx = headers.findIndex((h: string) => h.includes('weeks paid') || h.includes('paid'));
    const emgNameIdx = headers.findIndex((h: string) => h.includes('emergency contact'));
    const emgPhoneIdx = headers.findIndex((h: string) => h.includes('emergency phone'));

    const parsed: Member[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const name = String(row[nameIdx] || '').trim();
      if (!name) continue;

      const regNumber = String(row[regIdx] || `YSSC-2024-${String(i).padStart(3, '0')}`).trim();
      const rawSports = String(row[sportsIdx] || 'Cricket').split(',').map((s) => s.trim() as SportType);
      const joinedDate = normalizeSheetDate(row[joinedIdx], '2021-01-15');
      const weeksPaid = parseInt(row[duesIdx], 10) || 0;

      parsed.push({
        id: `mem-sheet-${regNumber.replace(/[^a-zA-Z0-9]/g, '-')}`,
        regNumber,
        name,
        sinhalaName: String(row[sinNameIdx] || name).trim(),
        nic: String(row[nicIdx] || '199500000000').trim(),
        phone: String(row[phoneIdx] || '+94 77 000 0000').trim(),
        address: String(row[addrIdx] || 'Gamudawa').trim(),
        sports: rawSports.length > 0 ? rawSports : ['Cricket'],
        primaryRole: String(row[roleIdx] || 'Player').trim(),
        jerseyNumber: parseInt(row[jerseyIdx], 10) || undefined,
        joinedDate,
        status: (String(row[statusIdx] || 'Active').trim() as any) || 'Active',
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?auto=format&fit=crop&w=250&q=80`,
        emergencyContact: {
          name: String(row[emgNameIdx] || 'Guardian').trim(),
          relationship: 'Family',
          phone: String(row[emgPhoneIdx] || '+94 77 111 2222').trim(),
        },
        weeklyDuesPaidCount: weeksPaid,
      });
    }

    return parsed;
  } catch (err) {
    console.warn(`Could not read '${sheetTitle}':`, err);
    return [];
  }
}

// ============================================================================
// 6. CLUB PROFILE & VISION (From official user document)
// ============================================================================
export async function syncClubProfileToSheet(
  accessToken: string,
  spreadsheetId: string,
  profile: ClubProfileInfo
): Promise<void> {
  const sheetTitle = 'Club Profile & Vision';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = ['Club Detail / Parameter', 'English Value', 'සිංහල අගය', 'Official Notes'];
  const rows = [
    ['Official Club Name', profile.clubNameEn, profile.clubNameSi, 'Government sports club registry'],
    ['Registration Number', profile.regNumber, profile.regNumber, 'District Secretariat Registration'],
    ['Established Year', profile.establishedYear, profile.establishedYear, 'Foundation of club in Gamudawa'],
    ['Home Grounds', profile.homeGroundEn, profile.homeGroundSi, 'Main training and match facility'],
    ['Official Email', profile.email, profile.email, 'Primary contact mailbox'],
    ['Official Phone', profile.phone, profile.phone, 'Hotline for fixtures and inquiries'],
    ['🎯 Vision (අපගේ දැක්ම)', profile.visionEn, profile.visionSi, 'Core purpose and vision for local youth'],
    ['🚀 Mission 1 (මෙහෙවර 1)', profile.missionEn[0] || '', profile.missionSi[0] || '', 'Youth talent & leadership environment'],
    ['🚀 Mission 2 (මෙහෙවර 2)', profile.missionEn[1] || '', profile.missionSi[1] || '', 'Brotherhood and community respect'],
    ['🚀 Mission 3 (මෙහෙවර 3)', profile.missionEn[2] || '', profile.missionSi[2] || '', 'Health, fitness & drug-free active lifestyle'],
    ['🚀 Mission 4 (මෙහෙවර 4)', profile.missionEn[3] || '', profile.missionSi[3] || '', 'Tournaments and infrastructure development'],
    ['Weekly Dues Rate (LKR)', String(profile.weeklyDuesRate), String(profile.weeklyDuesRate), 'Standard member contribution per week'],
    ['Current Active Week', String(profile.currentWeek), String(profile.currentWeek), 'Active week in 2026 calendar'],
  ];

  const fullGrid = [headerRow, ...rows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:D${fullGrid.length}`,
    fullGrid
  );
}

export async function readClubProfileFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Partial<ClubProfileInfo> | null> {
  const sheetTitle = 'Club Profile & Vision';
  try {
    const rows = await fetchSheetValues(accessToken, spreadsheetId, sheetTitle, 'A1:D30');
    if (!rows || rows.length < 2) return null;

    const profile: Partial<ClubProfileInfo> = {};
    const missionEnList: string[] = [];
    const missionSiList: string[] = [];

    rows.slice(1).forEach((r) => {
      const key = String(r[0] || '').toLowerCase();
      const enVal = String(r[1] || '').trim();
      const siVal = String(r[2] || '').trim();

      if (key.includes('name')) {
        profile.clubNameEn = enVal;
        profile.clubNameSi = siVal;
      } else if (key.includes('registration')) {
        profile.regNumber = enVal;
      } else if (key.includes('established')) {
        profile.establishedYear = enVal;
      } else if (key.includes('ground')) {
        profile.homeGroundEn = enVal;
        profile.homeGroundSi = siVal;
      } else if (key.includes('email')) {
        profile.email = enVal;
      } else if (key.includes('phone')) {
        profile.phone = enVal;
      } else if (key.includes('vision')) {
        profile.visionEn = enVal;
        profile.visionSi = siVal;
      } else if (key.includes('mission')) {
        if (enVal) missionEnList.push(enVal);
        if (siVal) missionSiList.push(siVal);
      } else if (key.includes('dues rate')) {
        profile.weeklyDuesRate = parseFloat(enVal) || 100;
      } else if (key.includes('current active week')) {
        profile.currentWeek = parseInt(enVal, 10) || 14;
      }
    });

    if (missionEnList.length > 0) profile.missionEn = missionEnList;
    if (missionSiList.length > 0) profile.missionSi = missionSiList;

    return profile;
  } catch (err) {
    console.warn(`Could not read '${sheetTitle}':`, err);
    return null;
  }
}

// ============================================================================
// 7. TEAMS & SQUADS
// ============================================================================
export async function syncSquadsToSheet(
  accessToken: string,
  spreadsheetId: string,
  squads: TeamSquad[]
): Promise<void> {
  const sheetTitle = 'Teams & Squads';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Squad ID',
    'Squad Name',
    'Sinhala Name',
    'Sport',
    'Captain ID / Name',
    'Vice-Captain ID',
    'Player Count',
    'Jersey Color',
    'Head Coach',
  ];

  const dataRows = squads.map((s) => [
    s.id,
    s.name,
    s.sinhalaName,
    s.sport,
    s.captainId,
    s.viceCaptainId || 'N/A',
    s.playerIds.length,
    s.jerseyColor,
    s.coachName || 'Executive Committee',
  ]);

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:I${fullGrid.length}`,
    fullGrid
  );
}

// ============================================================================
// 8. EXECUTIVE COMMITTEE
// ============================================================================
export async function syncCommitteeToSheet(
  accessToken: string,
  spreadsheetId: string,
  committee: CommitteeMember[]
): Promise<void> {
  const sheetTitle = 'Executive Committee';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Designation / Role',
    'සිංහල තනතුර',
    'Official Name',
    'Sinhala Name',
    'Contact Phone',
    'Official Email',
    'Term Period',
    'Official Responsibilities',
  ];

  const dataRows = committee.map((c) => [
    c.role,
    c.sinhalaRole,
    c.name,
    c.sinhalaName,
    c.phone,
    c.email,
    c.term,
    c.responsibility,
  ]);

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:H${fullGrid.length}`,
    fullGrid
  );
}

// ============================================================================
// 9. CLUB DOCUMENTS
// ============================================================================
export async function syncDocumentsToSheet(
  accessToken: string,
  spreadsheetId: string,
  documents: ClubDocument[]
): Promise<void> {
  const sheetTitle = 'Club Documents';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Document ID',
    'Document Title',
    'Sinhala Title',
    'Category',
    'Publication Date (YYYY-MM-DD)',
    'File Size',
    'Description',
  ];

  const dataRows = documents.map((d) => [
    d.id,
    d.title,
    d.sinhalaTitle,
    d.category,
    d.date,
    d.fileSize,
    d.description,
  ]);

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:G${fullGrid.length}`,
    fullGrid
  );
}

// ============================================================================
// 10. MEDIA GALLERY
// ============================================================================
export async function syncMediaToSheet(
  accessToken: string,
  spreadsheetId: string,
  media: MediaItem[]
): Promise<void> {
  const sheetTitle = 'Media Gallery';
  await ensureSheetTabExists(accessToken, spreadsheetId, sheetTitle);

  const headerRow = [
    'Photo ID',
    'Photo Title',
    'Album Name',
    'Sport',
    'Date (YYYY-MM-DD)',
    'Image URL',
    'Caption',
    'Photographer',
  ];

  const dataRows = media.map((m) => [
    m.id,
    m.title,
    m.album,
    m.sport,
    m.date,
    m.url,
    m.caption,
    m.photographer || 'Club Media',
  ]);

  const fullGrid = [headerRow, ...dataRows];
  await updateSheetRange(
    accessToken,
    spreadsheetId,
    sheetTitle,
    `A1:H${fullGrid.length}`,
    fullGrid
  );
}

// ============================================================================
// DYNAMIC SHEET TAB CREATION
// ============================================================================
export async function createNewSheetTabInSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  title: string,
  initialHeaders: string[] = ['ID', 'Title / Description', 'Date', 'Responsible Person', 'Status', 'Notes']
): Promise<SheetTabInfo> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Sheet title cannot be empty');

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: trimmed,
              gridProperties: {
                rowCount: 100,
                columnCount: Math.max(initialHeaders.length + 3, 10),
              },
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create sheet '${trimmed}': ${errorText}`);
  }

  const result = await res.json();
  const addedSheetProps = result.replies?.[0]?.addSheet?.properties;

  if (initialHeaders && initialHeaders.length > 0) {
    await updateSheetRange(accessToken, spreadsheetId, trimmed, `A1:${String.fromCharCode(64 + initialHeaders.length)}1`, [
      initialHeaders,
    ]);
  }

  return {
    sheetId: addedSheetProps?.sheetId || Date.now(),
    title: addedSheetProps?.title || trimmed,
    index: addedSheetProps?.index || 0,
    rowCount: 100,
    columnCount: initialHeaders.length,
  };
}

// ============================================================================
// COMPLETE MASTER WORKBOOK CREATOR & SYNC ALL
// ============================================================================
export interface CompleteClubData {
  members: Member[];
  matches: MatchScorecard[];
  transactions: FinancialTransaction[];
  committee: CommitteeMember[];
  squads: TeamSquad[];
  documents: ClubDocument[];
  media: MediaItem[];
  profile: ClubProfileInfo;
}

/**
 * Creates the official master club spreadsheet with all 10 standard sheets inside the specified Google Drive folder.
 */
export async function createOfficialMasterSpreadsheet(
  accessToken: string,
  data: CompleteClubData,
  folderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<{ id: string; spreadsheetUrl: string; title: string }> {
  const today = new Date().toISOString().split('T')[0];
  const title = `Young_Star_SC_Gamudawa_Master_Portal_${today}`;

  // 1. Create Spreadsheet with initial tabs
  const payload = {
    properties: { title },
    sheets: [
      { properties: { title: 'Tournaments & Matches' } },
      { properties: { title: 'Live Cricket Scorecard' } },
      { properties: { title: 'Weekly Membership Payments' } },
      { properties: { title: 'Expenses & Finances' } },
      { properties: { title: 'Members Roster' } },
      { properties: { title: 'Club Profile & Vision' } },
      { properties: { title: 'Teams & Squads' } },
      { properties: { title: 'Executive Committee' } },
      { properties: { title: 'Club Documents' } },
      { properties: { title: 'Media Gallery' } },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Move file into target Google Drive folder
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.warn('Could not add parent folder, created in root Drive:', err);
  }

  // 3. Populate all 10 tabs with formatted data & dates
  await syncMatchesToSheet(accessToken, spreadsheetId, data.matches);
  if (data.matches.length > 0) {
    const liveMatch = data.matches.find((m) => m.status === 'live') || data.matches[0];
    await syncLiveScorecardToSheet(accessToken, spreadsheetId, liveMatch);
  }
  await syncWeeklyPaymentsToSheet(accessToken, spreadsheetId, data.members, data.profile.currentWeek, data.profile.weeklyDuesRate);
  await syncExpensesToSheet(accessToken, spreadsheetId, data.transactions);
  await syncMembersToSheet(accessToken, spreadsheetId, data.members);
  await syncClubProfileToSheet(accessToken, spreadsheetId, data.profile);
  await syncSquadsToSheet(accessToken, spreadsheetId, data.squads);
  await syncCommitteeToSheet(accessToken, spreadsheetId, data.committee);
  await syncDocumentsToSheet(accessToken, spreadsheetId, data.documents);
  await syncMediaToSheet(accessToken, spreadsheetId, data.media);

  return {
    id: spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Pushes all 10 modules in current application state to Google Sheet.
 */
export async function pushAllDataToMasterSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: CompleteClubData
): Promise<void> {
  await syncMatchesToSheet(accessToken, spreadsheetId, data.matches);
  if (data.matches.length > 0) {
    const liveMatch = data.matches.find((m) => m.status === 'live') || data.matches[0];
    await syncLiveScorecardToSheet(accessToken, spreadsheetId, liveMatch);
  }
  await syncWeeklyPaymentsToSheet(accessToken, spreadsheetId, data.members, data.profile.currentWeek, data.profile.weeklyDuesRate);
  await syncExpensesToSheet(accessToken, spreadsheetId, data.transactions);
  await syncMembersToSheet(accessToken, spreadsheetId, data.members);
  await syncClubProfileToSheet(accessToken, spreadsheetId, data.profile);
  await syncSquadsToSheet(accessToken, spreadsheetId, data.squads);
  await syncCommitteeToSheet(accessToken, spreadsheetId, data.committee);
  await syncDocumentsToSheet(accessToken, spreadsheetId, data.documents);
  await syncMediaToSheet(accessToken, spreadsheetId, data.media);
}

/**
 * Reads all modules from the Google Sheet and updates app state.
 */
export async function readAllDataFromMasterSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  matches?: MatchScorecard[];
  members?: Member[];
  duesMap?: Record<string, number>;
  transactions?: FinancialTransaction[];
  profile?: Partial<ClubProfileInfo> | null;
}> {
  const [matches, members, duesMap, transactions, profile] = await Promise.all([
    readMatchesFromSheet(accessToken, spreadsheetId),
    readMembersFromSheet(accessToken, spreadsheetId),
    readWeeklyPaymentsFromSheet(accessToken, spreadsheetId),
    readExpensesFromSheet(accessToken, spreadsheetId),
    readClubProfileFromSheet(accessToken, spreadsheetId),
  ]);

  return {
    matches: matches.length > 0 ? matches : undefined,
    members: members.length > 0 ? members : undefined,
    duesMap: Object.keys(duesMap).length > 0 ? duesMap : undefined,
    transactions: transactions.length > 0 ? transactions : undefined,
    profile: profile || undefined,
  };
}

/**
 * Generates CSV content from 2D array of grid values.
 */
export function gridToCSV(rows: any[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell === null || cell === undefined ? '' : cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');
}

/**
 * Triggers a browser download of a CSV file.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
