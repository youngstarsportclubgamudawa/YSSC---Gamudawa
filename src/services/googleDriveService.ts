import { Member, FinancialTransaction, ClubProfileInfo, GplTeam, GplPlayer } from '../types';

export const GOOGLE_DRIVE_FOLDER_ID = '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96';
export const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}?usp=drive_link`;

export const OFFICIAL_VISION_MISSION = {
  clubNameEn: 'Young Star Sport Club - Gamudawa',
  clubNameSi: 'තරුණ තරු ක්‍රීඩා සමාජය - ගම්උදාව',
  regNumber: 'DS/SP/2018/14',
  email: 'youngstarsportclubgamudawa@gmail.com',
  visionEn: 'To be a leading sports community that empowers local youth through sportsmanship, discipline, and unity, producing healthy, responsible citizens and exceptional athletes who bring pride to our village and the nation.',
  visionSi: 'ක්‍රීඩාශීලිත්වය, විනය සහ එකමුතුකම තුළින් ප්‍රදේශයේ තරුණ පරපුර බලගන්වමින්, නිරෝගී, වගකිවයුතු පුරවැසියන් සහ අපේ ගමටත් මව්බිමටත් අභිමානයක් ගෙනෙන විශිෂ්ටතම ක්‍රීඩකයින් පිරිසක් බිහි කරන පෙරගමන්කරු වීම.',
  missionEn: [
    'To provide a safe, encouraging environment for youth to develop their sports talents and leadership skills.',
    'To foster strong bonds of brotherhood and mutual respect within our village community.',
    'To promote health, fitness, and a drug-free, active lifestyle among the younger generation.',
    'To organize tournaments and community projects that uplift our local sports infrastructure.',
  ],
  missionSi: [
    'තරුණ පරපුරේ ක්‍රීඩා දක්ෂතා සහ නායකත්ව හැකියාවන් වර්ධනය කරගැනීම සඳහා ආරක්ෂිත, දිරිගන්වනසුලු වටපිටාවක් නිර්මාණය කිරීම.',
    'ගමේ සමස්ත ප්‍රජාව අතර ශක්තිමත් සහෝදරත්වයක් සහ අන්‍යෝන්‍ය ගෞරවයක් වර්ධනය කිරීම.',
    'තරුණ පරපුර අතර නිරෝගීකම, ක්‍රියාශීලී ජීවන රටාව සහ මත්ද්‍රව්‍යවලින් තොර යහපත් සමාජයක් ප්‍රවර්ධනය කිරීම.',
    'ප්‍රදේශයේ ක්‍රීඩා ක්ෂේත්‍රය නංවාලීම උදෙසා ක්‍රීඩා තරඟ සහ ප්‍රජා සත්කාරක වැඩසටහන් අඛණ්ඩව සංවිධානය කිරීම.',
  ],
};

/**
 * Generates the exact CSV content matching the user's official Excel template.
 */
export function generateExactCharterCSVContent(profile?: Partial<ClubProfileInfo>): string {
  const p = {
    visionEn: profile?.visionEn || OFFICIAL_VISION_MISSION.visionEn,
    visionSi: profile?.visionSi || OFFICIAL_VISION_MISSION.visionSi,
    missionEn: profile?.missionEn || OFFICIAL_VISION_MISSION.missionEn,
    missionSi: profile?.missionSi || OFFICIAL_VISION_MISSION.missionSi,
  };

  const escapeCSV = (str: string) => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    ',',
    'Young Star Sport Club,',
    'Gamudawa,',
    ',',
    ',',
    '🎯 Our Vision (අපගේ දැක්ම),',
    ',',
    `," ""${p.visionEn}"""`,
    ',',
    `," ""${p.visionSi}"""`,
    ',',
    '🚀 Our Mission (අපගේ මෙහෙවර),',
    ',',
    `💪,${escapeCSV(p.missionEn[0] || OFFICIAL_VISION_MISSION.missionEn[0])}`,
    ',',
    `💪,${escapeCSV(p.missionEn[1] || OFFICIAL_VISION_MISSION.missionEn[1])}`,
    ',',
    `💪,${escapeCSV(p.missionEn[2] || OFFICIAL_VISION_MISSION.missionEn[2])}`,
    ',',
    `💪,${escapeCSV(p.missionEn[3] || OFFICIAL_VISION_MISSION.missionEn[3])}`,
    ',',
    ',',
    `💪,${escapeCSV(p.missionSi[0] || OFFICIAL_VISION_MISSION.missionSi[0])}`,
    ',',
    `💪,${escapeCSV(p.missionSi[1] || OFFICIAL_VISION_MISSION.missionSi[1])}`,
    ',',
    `💪,${escapeCSV(p.missionSi[2] || OFFICIAL_VISION_MISSION.missionSi[2])}`,
    ',',
    `💪,${escapeCSV(p.missionSi[3] || OFFICIAL_VISION_MISSION.missionSi[3])}`,
  ].join('\r\n');
}

/**
 * Parses user-uploaded or edited CSV file into club profile structure.
 */
export function parseExactCharterCSV(csvText: string): Partial<ClubProfileInfo> {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim());
  const cleanCell = (cell: string) => cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim();

  let visionEn = '';
  let visionSi = '';
  const missionEn: string[] = [];
  const missionSi: string[] = [];

  let inVisionSection = false;
  let inMissionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.includes('Vision') || line.includes('දැක්ම')) {
      inVisionSection = true;
      inMissionSection = false;
      continue;
    }

    if (line.includes('Mission') || line.includes('මෙහෙවර')) {
      inMissionSection = true;
      inVisionSection = false;
      continue;
    }

    if (inVisionSection) {
      const parts = line.split(',');
      const text = cleanCell(parts.slice(1).join(','));
      if (text) {
        // Distinguish English from Sinhala by presence of Sinhala unicode characters
        const isSinhala = /[\u0D80-\u0DFF]/.test(text);
        if (isSinhala && !visionSi) {
          visionSi = text;
        } else if (!isSinhala && !visionEn) {
          visionEn = text;
        }
      }
    } else if (inMissionSection) {
      if (line.includes('💪')) {
        const parts = line.split(',');
        const text = cleanCell(parts.slice(1).join(','));
        if (text && text !== '💪') {
          const isSinhala = /[\u0D80-\u0DFF]/.test(text);
          if (isSinhala) {
            missionSi.push(text);
          } else {
            missionEn.push(text);
          }
        }
      }
    }
  }

  const result: Partial<ClubProfileInfo> = {};
  if (visionEn) result.visionEn = visionEn;
  if (visionSi) result.visionSi = visionSi;
  if (missionEn.length > 0) result.missionEn = missionEn;
  if (missionSi.length > 0) result.missionSi = missionSi;

  return result;
}

/**
 * Creates a file in the user's specific Google Drive folder using multipart upload.
 */
export async function uploadFileToDriveFolder(
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: string,
  folderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Saves the official CSV charter directly into the specified Google Drive folder.
 */
export async function saveExactCharterCSVToGoogleDrive(
  accessToken: string,
  profile?: ClubProfileInfo
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const csvContent = generateExactCharterCSVContent(profile);
  return await uploadFileToDriveFolder(
    accessToken,
    'Young_Star_Sport_Club_Gamudawa.csv',
    'text/csv',
    csvContent
  );
}

/**
 * Saves the official Vision & Mission statement text into the specified Google Drive folder.
 */
export async function saveVisionMissionToGoogleDrive(
  accessToken: string,
  profile?: ClubProfileInfo
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const p = profile || (OFFICIAL_VISION_MISSION as any);
  const fileContent = `========================================================================
YOUNG STAR SPORT CLUB - GAMUDAWA
තරුණ තරු ක්‍රීඩා සමාජය - ගම්උදාව
Official Vision & Mission Statement / නිල දැක්ම සහ මෙහෙවර
Registration No: DS/SP/2018/14 · Gamudawa, Sri Lanka
========================================================================

🎯 OUR VISION (අපගේ දැක්ම):
------------------------------------------------------------------------
[English]:
"${p.visionEn || OFFICIAL_VISION_MISSION.visionEn}"

[සිංහල]:
"${p.visionSi || OFFICIAL_VISION_MISSION.visionSi}"

========================================================================
🚀 OUR MISSION (අපගේ මෙහෙවර):
------------------------------------------------------------------------
[English]:
1. ${p.missionEn?.[0] || OFFICIAL_VISION_MISSION.missionEn[0]}
2. ${p.missionEn?.[1] || OFFICIAL_VISION_MISSION.missionEn[1]}
3. ${p.missionEn?.[2] || OFFICIAL_VISION_MISSION.missionEn[2]}
4. ${p.missionEn?.[3] || OFFICIAL_VISION_MISSION.missionEn[3]}

[සිංහල]:
1. ${p.missionSi?.[0] || OFFICIAL_VISION_MISSION.missionSi[0]}
2. ${p.missionSi?.[1] || OFFICIAL_VISION_MISSION.missionSi[1]}
3. ${p.missionSi?.[2] || OFFICIAL_VISION_MISSION.missionSi[2]}
4. ${p.missionSi?.[3] || OFFICIAL_VISION_MISSION.missionSi[3]}

========================================================================
Saved from Young Star Sport Club Gamudawa Management Portal
Date: ${new Date().toLocaleString()}
Target Folder ID: ${GOOGLE_DRIVE_FOLDER_ID}
`;

  return await uploadFileToDriveFolder(
    accessToken,
    'Young_Star_Sport_Club_Gamudawa_Vision_and_Mission.txt',
    'text/plain',
    fileContent
  );
}

/**
 * Creates or synchronizes a Google Spreadsheet in the Drive folder for Weekly Dues and Ledger.
 */
export async function createAndSyncGoogleSheetInDrive(
  accessToken: string,
  members: Member[],
  transactions: FinancialTransaction[]
): Promise<{ id: string; spreadsheetUrl: string }> {
  // Step 1: Create Spreadsheet
  const sheetPayload = {
    properties: {
      title: `Young_Star_SC_Gamudawa_Weekly_Dues_2026_${new Date().toISOString().split('T')[0]}`,
    },
    sheets: [
      {
        properties: {
          title: 'Member Dues Matrix',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
      {
        properties: {
          title: 'Financial Ledger',
          gridProperties: { rowCount: 150, columnCount: 10 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sheetPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // Step 2: Move the spreadsheet to the user's specific Google Drive folder
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${GOOGLE_DRIVE_FOLDER_ID}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.warn('Could not add parent folder to sheet, it remains in Drive root', err);
  }

  // Step 3: Populate Member Dues Matrix values
  const currentWeek = 14;
  const weeklyRate = 100;
  const duesRows = [
    ['Reg Number', 'Full Name', 'Sinhala Name', 'Primary Role', 'Phone', 'Weeks Paid', 'Total Paid (LKR)', 'Current Week', 'Arrears (LKR)', 'Status'],
    ...members.map((m) => {
      const totalPaid = m.weeklyDuesPaidCount * weeklyRate;
      const expected = currentWeek * weeklyRate;
      const arrears = expected - totalPaid;
      const status = arrears <= 0 ? 'SETTLED' : arrears <= 200 ? 'PENDING' : 'OVERDUE';
      return [
        m.regNumber,
        m.name,
        m.sinhalaName,
        m.primaryRole,
        m.phone,
        m.weeklyDuesPaidCount,
        totalPaid,
        currentWeek,
        arrears,
        status,
      ];
    }),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Member Dues Matrix'!A1:J${duesRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: duesRows }),
    }
  );

  // Step 4: Populate Financial Ledger transactions
  const ledgerRows = [
    ['Receipt Number', 'Date', 'Entity / Member Name', 'Category', 'Type', 'Amount (LKR)', 'Payment Method', 'Reference No', 'Recorded By', 'Notes'],
    ...transactions.map((t) => [
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
    ]),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Financial Ledger'!A1:J${ledgerRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: ledgerRows }),
    }
  );

  return { id: spreadsheetId, spreadsheetUrl };
}

/**
 * Lists files created in the target Google Drive folder.
 */
export async function listFilesInDriveFolder(
  accessToken: string,
  folderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink?: string; createdTime?: string }>> {
  try {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Failed to list files in folder:', err);
    return [];
  }
}

/**
 * Creates a subfolder in Google Drive under a parent folder.
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Drive folder (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Uploads a base64 player portrait photo to a Google Drive folder.
 */
export async function uploadBase64ImageToDriveFolder(
  accessToken: string,
  fileName: string,
  dataUrl: string,
  folderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<{ id: string; name: string; webViewLink?: string }> {
  // Extract mime type and base64 payload
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match ? match[1] : 'image/jpeg';
  const base64Data = match ? match[2] : dataUrl;

  // Convert base64 to binary string for multipart body
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType,
  };

  const boundary = '-------gplphotoupload314159265';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Build binary multipart body
  const metaHeader =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
    base64Data +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: metaHeader,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Player photo upload to Drive failed (${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * Formats a GPL team squad into CSV format for Microsoft Excel.
 */
export function generateTeamSquadCSV(team: GplTeam): string {
  const escapeCSV = (str: any) => {
    const text = String(str || '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const headers = [
    'Slot #',
    'Jersey No',
    'Player Official Name',
    'Sinhala Name',
    'Playing Role',
    'Jersey Size',
    'Payment Status',
    'Contact Phone',
    'NIC Number',
    'Team Honor (C / VC)',
    'Photo Reference',
  ];

  const rows = team.players.map((p) => [
    p.slot,
    p.jerseyNumber,
    escapeCSV(p.name),
    escapeCSV(p.sinhalaName || ''),
    escapeCSV(p.role),
    p.jerseySize,
    escapeCSV(p.paymentStatus),
    escapeCSV(p.phone),
    escapeCSV(p.nic),
    p.isCaptain ? 'Captain (C)' : p.isViceCaptain ? 'Vice-Captain (VC)' : 'Squad Player',
    p.photoUrl?.startsWith('data:') ? 'Local Image Attached' : escapeCSV(p.photoUrl || ''),
  ]);

  const metaRows = [
    ['Gamudawa Premier League (GPL 2026) - Official Team Squad Roster'],
    [`Team: ${team.name} (${team.sinhalaName})`],
    [`Manager: ${team.managerName} (${team.managerPhone})`],
    [`Captain: ${team.captainName} | Vice-Captain: ${team.viceCaptainName}`],
    [`Export Date: ${new Date().toLocaleString()}`],
    [],
  ];

  const fullGrid = [
    ...metaRows.map((r) => r.join(',')),
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ];

  return fullGrid.join('\r\n');
}

/**
 * Synchronizes an entire GPL Team Squad (JSON, CSV, and player photos) to Google Drive.
 */
export async function saveTeamSquadToGoogleDrive(
  accessToken: string,
  team: GplTeam,
  parentFolderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<{
  folderId: string;
  folderUrl: string;
  uploadedPhotoCount: number;
  csvFileName: string;
}> {
  // Step 1: Create a dedicated Team Folder inside Google Drive
  const teamFolderName = `GPL_2026_Team_${String(team.teamNumber).padStart(2, '0')}_${team.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const teamFolder = await createDriveFolder(accessToken, teamFolderName, parentFolderId);
  const targetFolderId = teamFolder.id;
  const folderUrl = teamFolder.webViewLink || `https://drive.google.com/drive/folders/${targetFolderId}`;

  // Step 2: Upload CSV Roster
  const csvContent = generateTeamSquadCSV(team);
  const csvFileName = `GPL2026_Team_${team.teamNumber}_Roster.csv`;
  await uploadFileToDriveFolder(accessToken, csvFileName, 'text/csv', csvContent, targetFolderId);

  // Step 3: Upload JSON Roster
  const jsonContent = JSON.stringify(team, null, 2);
  const jsonFileName = `GPL2026_Team_${team.teamNumber}_Data.json`;
  await uploadFileToDriveFolder(accessToken, jsonFileName, 'application/json', jsonContent, targetFolderId);

  // Step 4: Upload all player photos that have local uploaded base64 data
  let uploadedPhotoCount = 0;
  for (const player of team.players) {
    if (player.photoUrl && player.photoUrl.startsWith('data:image')) {
      try {
        const photoName = `Player_${String(player.slot).padStart(2, '0')}_No${player.jerseyNumber}_${player.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
        await uploadBase64ImageToDriveFolder(accessToken, photoName, player.photoUrl, targetFolderId);
        uploadedPhotoCount++;
      } catch (photoErr) {
        console.warn(`Failed to upload photo for ${player.name}:`, photoErr);
      }
    }
  }

  return {
    folderId: targetFolderId,
    folderUrl,
    uploadedPhotoCount,
    csvFileName,
  };
}
