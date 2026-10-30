import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSpreadsheetId } from '../services/googleSheetsLiveService';

test('extractSpreadsheetId extracts ID from full Google Docs URL', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96/edit?usp=sharing';
  assert.equal(extractSpreadsheetId(url), '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96');
});

test('extractSpreadsheetId extracts ID from view URL', () => {
  const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view';
  assert.equal(extractSpreadsheetId(url), '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
});

test('extractSpreadsheetId handles raw spreadsheet ID', () => {
  const rawId = '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96';
  assert.equal(extractSpreadsheetId(rawId), '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96');
});

test('extractSpreadsheetId handles trailing slashes or whitespace', () => {
  const padded = '  1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96/   ';
  assert.equal(extractSpreadsheetId(padded), '1-FPe6LhIIC2hKXCrDE6hIbqNhhc7hz96');
});

test('extractSpreadsheetId returns empty string for empty input', () => {
  assert.equal(extractSpreadsheetId(''), '');
  assert.equal(extractSpreadsheetId('   '), '');
});

test('gridToCSV formats rows and handles escaping', async () => {
  const { gridToCSV } = await import('../services/googleSheetsLiveService');
  const rows = [
    ['Name', 'Amount', 'Notes'],
    ['Charith Jayasuriya', 1400, 'Paid, in full'],
    ['Kasun Fernando', 1400, 'Cash "receipt" issued'],
  ];
  const csv = gridToCSV(rows);
  assert.ok(csv.includes('"Paid, in full"'));
  assert.ok(csv.includes('"Cash ""receipt"" issued"'));
});

test('generateExactCharterCSVContent generates exact user charter structure', async () => {
  const { generateExactCharterCSVContent } = await import('../services/googleDriveService');
  const csv = generateExactCharterCSVContent();
  assert.ok(csv.includes('Young Star Sport Club'));
  assert.ok(csv.includes('Gamudawa'));
  assert.ok(csv.includes('🎯 Our Vision (අපගේ දැක්ම)'));
  assert.ok(csv.includes('🚀 Our Mission (අපගේ මෙහෙවර)'));
  assert.ok(csv.includes('💪'));
  assert.ok(csv.includes('To be a leading sports community that empowers local youth'));
  assert.ok(csv.includes('ක්‍රීඩාශීලිත්වය, විනය සහ එකමුතුකම තුළින්'));
  assert.ok(csv.includes('To provide a safe, encouraging environment'));
  assert.ok(csv.includes('තරුණ පරපුරේ ක්‍රීඩා දක්ෂතා'));
});

test('parseExactCharterCSV parses user uploaded CSV charter correctly', async () => {
  const { parseExactCharterCSV, generateExactCharterCSVContent } = await import('../services/googleDriveService');
  const sampleCSV = generateExactCharterCSVContent();
  const parsed = parseExactCharterCSV(sampleCSV);

  assert.ok(parsed.visionEn?.includes('leading sports community'));
  assert.ok(parsed.visionSi?.includes('ක්‍රීඩාශීලිත්වය'));
  assert.equal(parsed.missionEn?.length, 4);
  assert.equal(parsed.missionSi?.length, 4);
  assert.ok(parsed.missionEn[0].includes('safe, encouraging environment'));
  assert.ok(parsed.missionSi[0].includes('තරුණ පරපුරේ ක්‍රීඩා දක්ෂතා'));
});

