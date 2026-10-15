// Isolated local review: generates a temporary session key; never reads hosting credentials.
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const host=process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1';
console.log('CarbonEx local review: http://localhost:3000/login');
console.log('Use the recruiter demo buttons. This does not deploy the app.');
if(host==='0.0.0.0')console.log('LAN mode: open http://YOUR_LAPTOP_IP:3000/login on your own Wi-Fi.');
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),'dev','--hostname',host,'--port','3000'],{cwd:root,stdio:'inherit',env:{...process.env,JWT_SECRET:randomBytes(32).toString('hex'),NEXT_TELEMETRY_DISABLED:'1'}});
child.on('exit',code=>process.exit(code??0));
child.on('error',error=>{console.error(error.message);process.exit(1)});
