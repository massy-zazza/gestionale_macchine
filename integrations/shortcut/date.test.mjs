import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDate } from './date.mjs';

test('Apple and Italian dates preserve the selected calendar day', () => {
  for (const value of ['2026-10-03','2026-10-03T00:30:00+02:00','03/10/2026','3.10.2026','3 ottobre 2026','sabato 3 ottobre 2026','3 ott 2026 alle 00:30']) {
    assert.equal(normalizeDate(value), '2026-10-03', value);
  }
  assert.equal(normalizeDate('29/02/2024'), '2024-02-29');
});
test('missing, ambiguous and impossible dates are rejected', () => {
  for (const value of ['', null, 'Custom', '03/10/26', '31/02/2026', '29/02/2026', '2026-13-03']) {
    assert.throws(() => normalizeDate(value), undefined, String(value));
  }
});
