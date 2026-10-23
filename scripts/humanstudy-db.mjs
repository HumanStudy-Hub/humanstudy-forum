import { mkdir, readFile } from 'node:fs/promises';
import { PGlite } from '../.humanstudy-tools/node_modules/@electric-sql/pglite/dist/index.js';
import { PGLiteSocketServer } from '../.humanstudy-tools/node_modules/@electric-sql/pglite-socket/dist/index.js';
import { btree_gin } from '../.humanstudy-tools/node_modules/@electric-sql/pglite/dist/contrib/btree_gin.js';
import { cube } from '../.humanstudy-tools/node_modules/@electric-sql/pglite/dist/contrib/cube.js';
import { earthdistance } from '../.humanstudy-tools/node_modules/@electric-sql/pglite/dist/contrib/earthdistance.js';
import { intarray } from '../.humanstudy-tools/node_modules/@electric-sql/pglite/dist/contrib/intarray.js';
import { pg_trgm } from '../.humanstudy-tools/node_modules/@electric-sql/pglite/dist/contrib/pg_trgm.js';
import { vector } from '../.humanstudy-tools/node_modules/@electric-sql/pglite-pgvector/dist/index.js';

await mkdir('.humanstudy-data', { recursive: true });
const db = await PGlite.create('.humanstudy-data/postgres', { extensions: { btree_gin, cube, earthdistance, intarray, pg_trgm, vector } });
const { rows } = await db.query(`SELECT to_regclass('public."Users"') AS table_name`);
if (!rows[0].table_name) {
  await db.exec(await readFile('schema/accepted_schema.sql', 'utf8'));
}
await db.query(`INSERT INTO "DatabaseMetadata" (_id,name,value) VALUES ('humanstudy-local-db','databaseId','"humanstudy-local"') ON CONFLICT (_id) DO NOTHING`);
const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 55439, maxConnections: 16 });
await server.start();
console.log('HumanStudy local development Postgres is ready on 127.0.0.1:55439');
async function stop() { await server.stop(); await db.close(); process.exit(0); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
