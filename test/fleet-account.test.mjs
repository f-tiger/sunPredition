import assert from 'node:assert/strict';
import {accountRoute} from '../src/fleet-account/edge.mjs';
const base='https://invest.agiscorecard.com';
const page=await accountRoute(new Request(base+'/auth/account'));assert.equal(page.status,200);assert.match(page.headers.get('X-Robots-Tag'),/noindex/);assert.match(page.headers.get('Cache-Control'),/no-store/);assert((await page.text()).includes('Continue with Google'));
const start=await accountRoute(new Request(base+'/auth/google'));assert.equal(start.status,303);assert.equal(new URL(start.headers.get('Location')).origin,'https://baipiaoji.com');assert.match(start.headers.get('Set-Cookie'),/HttpOnly/);
assert.equal((await accountRoute(new Request(base+'/auth/callback?code=bad&state=bad'))).status,400);
assert.equal((await accountRoute(new Request(base+'/auth/logout',{method:'POST',headers:{Origin:'https://evil.example'}}))).status,403);
console.log('PASS SunWatch registration routing, browser-state binding and privacy. No external calls.');
