import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMigration} from '../scripts/migrate-private-config.mjs';
const previous='const AGI_ALERT_KEY = "synthetic-test-only";\nconst USDT_ADDR = "synthetic-address-only";';
test('private migration copies only missing bindings',()=>{
 assert.deepEqual(prepareMigration([],previous),{AGI_ALERT_KEY:'synthetic-test-only',USDT_RECEIVE_ADDRESS:'synthetic-address-only'});
 assert.deepEqual(prepareMigration(['AGI_ALERT_KEY'],previous),{USDT_RECEIVE_ADDRESS:'synthetic-address-only'});
});
test('existing secrets are preserved without requiring historical plaintext',()=>{
 assert.deepEqual(prepareMigration(['AGI_ALERT_KEY','USDT_RECEIVE_ADDRESS'],''),{});
});
test('missing migration input stops instead of deploying empty payment credentials',()=>{
 assert.throws(()=>prepareMigration([],''),/Missing migration input/);
 assert.throws(()=>prepareMigration([],'const AGI_ALERT_KEY = "";'),/Missing migration input/);
});
