// One-time deployment migration: existing values move from the previous revision
// into the SAME Cloudflare worker's private bindings. Never log their values.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export function prepareMigration(names, previous){
 const existing=new Set(names);
 const values={};
 for(const [name,legacy] of [['AGI_ALERT_KEY','AGI_ALERT_KEY'],['USDT_RECEIVE_ADDRESS','USDT_ADDR']]){
  if(existing.has(name))continue;
  const match=previous.match(new RegExp('const '+legacy+' = \"([^\"\\n]+)\"'));
  if(!match)throw Error('Missing migration input');
  values[name]=match[1];
 }
 return values;
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
if(process.env.GITHUB_ACTIONS!=='true'||!process.env.CLOUDFLARE_API_TOKEN)throw Error('Run only in the authorized deployment workflow');
const cli=args=>execFileSync('npx',['--yes','wrangler@4',...args],{encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:2e6});
let dir;
try{
 const names=new Set(JSON.parse(cli(['secret','list'])).map(x=>x.name));
 const missing=[['AGI_ALERT_KEY','AGI_ALERT_KEY'],['USDT_RECEIVE_ADDRESS','USDT_ADDR']].filter(([name])=>!names.has(name));
 if(!missing.length){console.log('Private worker bindings already exist; preserved without overwrite.');}
 else{
  const previous=execFileSync('git',['show','HEAD^:src/index.js'],{encoding:'utf8',stdio:['pipe','pipe','pipe']});
  const values=prepareMigration([...names],previous);
  dir=mkdtempSync(join(tmpdir(),'sunwatch-private-'));
  const path=join(dir,'bindings.json');writeFileSync(path,JSON.stringify(values),{mode:0o600});
  cli(['secret','bulk',path]);
  const after=new Set(JSON.parse(cli(['secret','list'])).map(x=>x.name));
  if(missing.some(([name])=>!after.has(name)))throw Error('Migration verification failed');
  console.log('Legacy bindings migrated to the existing SunWatch worker; values withheld.');
 }
}catch{console.error('Private binding migration failed; deployment stopped before code replacement.');process.exitCode=1;}
finally{if(dir)rmSync(dir,{recursive:true,force:true});}

}
