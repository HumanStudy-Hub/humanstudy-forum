import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { createConnection } from 'node:net';
import { existsSync } from 'node:fs';

if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Use Node 24.13 or newer. See .nvmrc.');
if (!existsSync('.humanstudy-tools/node_modules/.bin/yarn')) throw new Error('Run npm run humanstudy:setup first.');
const port = Number(process.env.HUMANSTUDY_FORUM_PORT ?? 3120);
const env = { ...process.env, ENV_NAME: 'humanstudy', FORUM_TYPE: 'LessWrong', PORT: String(port), PG_URL: 'postgres://postgres:local@127.0.0.1:55439/postgres', PG_MAX_CONNECTIONS: '1', NEXT_TELEMETRY_DISABLED: '1', PATH: `${dirname(process.execPath)}:${resolve('.humanstudy-tools/node_modules/.bin')}:${process.env.PATH}` };
const children = [];
function run(script, args = []) {
  const child = spawn(process.execPath, [script, ...args], { env, stdio: 'inherit' });
  children.push(child);
  return child;
}
function runOnce(script, args = []) {
  const child = run(script, args);
  return new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))); });
}
function reachable() {
  return new Promise(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port: 55439 });
    socket.setTimeout(500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}
function stop() { for (const child of children) if (child.exitCode === null) child.kill('SIGTERM'); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  if (!await reachable()) {
    const db = run('scripts/humanstudy-db.mjs');
    for (let i = 0; !await reachable(); i++) {
      if (i > 80 || db.exitCode !== null) throw new Error('Local forum database did not start.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  await runOnce('scripts/humanstudy-seed.mjs');
  await runOnce('.humanstudy-tools/node_modules/yarn/bin/yarn.js', ['generate']);
  console.log(`HumanStudy Forum: http://127.0.0.1:${port}`);
  await runOnce('node_modules/next/dist/bin/next', ['dev', '--hostname', '127.0.0.1', '--port', String(port)]);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { stop(); }
