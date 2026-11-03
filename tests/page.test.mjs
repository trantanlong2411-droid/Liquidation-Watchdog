import test from 'node:test';import assert from 'node:assert/strict';import {Script} from 'node:vm';
import {HTML} from '../src/page.mjs';
test('UI contains real borrower, editable thresholds and alert channel',()=>{
 for(const s of ['0x6cc38cd9741cdcdcd6ffc05b527779596d140e29','1.3','1.1',
 'Start 60s monitoring','console.warn','SIMULATED_ALERT_ONLY_NOT_CHAIN_DATA','Export JSON evidence'])
 assert.ok(HTML.includes(s),s);
});
test('Browser script parses',()=>{
 const match=HTML.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match);new Script(match[1]);
});
