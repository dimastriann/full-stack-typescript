import { execFileSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args, cwd) => execFileSync(npm, args, { cwd, stdio: 'inherit' });

run(['ci'], 'backend');
run(['ci'], 'frontend');
run(['exec', 'prisma', 'migrate', 'deploy'], 'backend');

if (process.env.SEED_DEMO_DATA === 'true') run(['run', 'seed'], 'backend');

console.log('Bootstrap complete. Start the app with: npm run dev');
