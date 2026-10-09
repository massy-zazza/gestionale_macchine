import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../src/accounting.js',import.meta.url),'utf8'),context);
test('mixed fuel and toll reimbursement reduces spending exactly once',()=>{
  const rows=[{cents:10000},{cents:850},{cents:3000}],refunds=[{amount_cents:2100},{amount_cents:500}];
  const result=context.costSummary(rows,refunds);
  assert.equal(result.gross,13850);assert.equal(result.reimbursed,2600);assert.equal(result.net,11250);
  assert.equal(rows[0].cents,10000);assert.equal(rows[1].cents,850);
});
test('refund-only periods retain their credit instead of discarding it',()=>{
  assert.equal(context.costSummary([],[{amount_cents:2100}]).net,-2100);
  assert.equal(context.costSummary([],[]).net,0);
});
