// Scoped fixed-action verification key. Never print the key or the Cloudflare token.
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const token=process.env.CLOUDFLARE_API_TOKEN;if(!token)throw Error('Existing deployment token required');
const key=createHash('sha256').update(token+'\0sunwatch:roadmap-verification:v1').digest('hex');
try{execFileSync('npx',['--yes','wrangler@4','secret','put','ROADMAP_VERIFY_KEY'],{input:key,stdio:['pipe','pipe','pipe'],env:process.env});console.log('Scoped roadmap verification binding configured.');}
catch{throw Error('Scoped verification binding configuration failed; no secret printed');}
