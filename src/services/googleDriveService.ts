import { Member, FinancialTransaction } from '../types';

export const GOOGLE_DRIVE_FOLDER_ID = '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96';
export const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}?usp=drive_link`;

export const OFFICIAL_VISION_MISSION = {
  clubNameEn: 'Young Star Sports Club - Gamudawa',
  clubNameSi: 'තරුණ තරු ක්‍රීඩා සමාජය - ගම්උදාව',
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
 * Saves the official Vision & Mission statement into the specified Google Drive folder.
 */
export async function saveVisionMissionToGoogleDrive(
  accessToken: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const fileContent = `========================================================================
YOUNG STAR SPORTS CLUB - GAMUDAWA
තරුණ තරු ක්‍රීඩා සමාජය - ගම්උදාව
Official Vision & Mission Statement / නිල දැක්ම සහ මෙහෙවර
Registration No: DS/SP/2018/14 · Gamudawa, Sri Lanka
========================================================================

🎯 OUR VISION (අපගේ දැක්ම):
------------------------------------------------------------------------
[English]:
"${OFFICIAL_VISION_MISSION.visionEn}"

[සිංහල]:
"${OFFICIAL_VISION_MISSION.visionSi}"

========================================================================
🚀 OUR MISSION (අපගේ මෙහෙවර):
------------------------------------------------------------------------
[English]:
1. ${OFFICIAL_VISION_MISSION.missionEn[0]}
2. ${OFFICIAL_VISION_MISSION.missionEn[1]}
3. ${OFFICIAL_VISION_MISSION.missionEn[2]}
4. ${OFFICIAL_VISION_MISSION.missionEn[3]}

[සිංහල]:
1. ${OFFICIAL_VISION_MISSION.missionSi[0]}
2. ${OFFICIAL_VISION_MISSION.missionSi[1]}
3. ${OFFICIAL_VISION_MISSION.missionSi[2]}
4. ${OFFICIAL_VISION_MISSION.missionSi[3]}

========================================================================
Saved from Young Star Sports Club Gamudawa Management Portal
Date: ${new Date().toLocaleString()}
Target Folder ID: ${GOOGLE_DRIVE_FOLDER_ID}
`;

  return await uploadFileToDriveFolder(
    accessToken,
    'Young_Star_Sports_Club_Gamudawa_Vision_and_Mission.txt',
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
