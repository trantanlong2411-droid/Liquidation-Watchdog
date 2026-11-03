import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';
import {PROOF_HTML,PROOF_RECORD} from '../src/proof.mjs';

test('reviewer proof covers all four task requirements',()=>{
  assert.equal(PROOF_RECORD.requirements.length,4);
  assert.deepEqual(PROOF_RECORD.requirements.map(item=>item.id),[1,2,3,4]);
  assert.match(PROOF_HTML,/READ FROM CHAIN/);
  assert.match(PROOF_HTML,/CONFIGURABLE THRESHOLDS/);
  assert.match(PROOF_HTML,/TIMESTAMPED ALERT CHANNEL/);
  assert.match(PROOF_HTML,/CONCRETE REMEDIES/);
});

test('historical results are never presented as current live balances',()=>{
  assert.equal(PROOF_RECORD.status,'HISTORICAL_VERIFIED_RUN_NOT_CURRENT_POSITION');
  assert.equal(PROOF_RECORD.chainId,1672);
  assert.match(PROOF_HTML,/historical estimate, not the current value/);
  assert.match(PROOF_HTML,/Unaccrued interest and oracle freshness/);
});

test('GET /proof returns public independent reviewer page',async()=>{
  const response=await worker.fetch(new Request('https://watchdog.example/proof'));
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/text\/html/);
  const html=await response.text();
  assert.match(html,/Check real position now/);
  assert.match(html,/\/api\/check/);
  assert.match(html,/Verified GitHub Actions run/);
});

test('GET /api/proof returns immutable historical evidence metadata',async()=>{
  const response=await worker.fetch(new Request('https://watchdog.example/api/proof'));
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.status,'HISTORICAL_VERIFIED_RUN_NOT_CURRENT_POSITION');
  assert.equal(data.verifiedBlock,'22010881');
  assert.equal(data.historicalAlert,'CRITICAL');
  assert.equal(data.requirements.length,4);
});
