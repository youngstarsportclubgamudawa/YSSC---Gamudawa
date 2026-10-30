import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSheetDate, excelSerialToDateString, formatDisplayDate } from './dateUtils';

test('normalizeSheetDate handles standard ISO YYYY-MM-DD', () => {
  assert.equal(normalizeSheetDate('2026-10-27'), '2026-10-27');
  assert.equal(normalizeSheetDate('2026/04/18'), '2026-04-18');
});

test('normalizeSheetDate handles DD/MM/YYYY and DD-MM-YYYY', () => {
  assert.equal(normalizeSheetDate('27/10/2026'), '2026-10-27');
  assert.equal(normalizeSheetDate('5-11-2026'), '2026-11-05');
  assert.equal(normalizeSheetDate('04/02/2026'), '2026-02-04');
});

test('normalizeSheetDate handles Excel serial dates', () => {
  // 46322 in Excel is roughly 2026-10-27
  const iso = excelSerialToDateString(46322);
  assert.match(iso, /^2026-10-\d{2}$/);
  assert.equal(normalizeSheetDate(46322), iso);
  assert.equal(normalizeSheetDate('46322'), iso);
});

test('normalizeSheetDate handles text formats and fallbacks', () => {
  assert.equal(normalizeSheetDate('Oct 27, 2026'), '2026-10-27');
  assert.equal(normalizeSheetDate('', '2026-10-27'), '2026-10-27');
  assert.equal(normalizeSheetDate(null, '2026-10-27'), '2026-10-27');
});

test('formatDisplayDate formats valid dates', () => {
  assert.equal(formatDisplayDate('2026-10-27', 'en'), '27 Oct 2026');
  assert.equal(formatDisplayDate('2026-10-27', 'si'), '2026-10-27');
});
