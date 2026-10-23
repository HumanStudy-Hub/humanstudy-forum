import { mkdir, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Use Node 24.13 or newer. See .nvmrc.');
await mkdir('.humanstudy-tools', { recursive: true });
await copyFile('humanstudy/tooling-package.json', '.humanstudy-tools/package.json');
const env = { ...process.env, PATH: `${dirname(process.execPath)}:${resolve('.humanstudy-tools/node_modules/.bin')}:${process.env.PATH}` };
const commands = [
  ['npm', ['install', '--prefix', '.humanstudy-tools', '--no-audit', '--no-fund']],
  ['yarn', ['install', '--frozen-lockfile', '--ignore-scripts']],
  ['npm', ['rebuild', 'bcrypt']],
  ['yarn', ['rebuild-excalidraw']],
  ['yarn', ['--cwd', 'fly/hocuspocusServer', 'install', '--frozen-lockfile']],
];
for (const [command, args] of commands) {
  const result = spawnSync(command, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Ready. Run npm run humanstudy:dev in this checkout.');
