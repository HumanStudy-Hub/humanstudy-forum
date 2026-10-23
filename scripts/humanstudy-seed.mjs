import { readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.PG_URL;
if (!url || !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Example seeding requires an explicit localhost PG_URL.');
const client = new pg.Client({ connectionString: url });
await client.connect();
const identity = await client.query(`SELECT value FROM "DatabaseMetadata" WHERE name='databaseId'`);
if (identity.rows[0]?.value !== 'humanstudy-local') throw new Error('Refusing to seed a database without the humanstudy-local identity.');
const examples = JSON.parse(await readFile('humanstudy/examples.json', 'utf8'));
const user = 'hsExampleResearcher001';
await client.query(`INSERT INTO "Users" (_id, slug, "displayName", "abTestKey", "username", "reviewedByUserId") VALUES ($1,'example-researcher','Example researcher',$2,'example-researcher',$3) ON CONFLICT (_id) DO NOTHING`, [user,user,user]);
for (const [i, post] of examples.entries()) {
  const revision = `${post.id}Rev`;
  const when = new Date(Date.now() - i * 36e5);
  const words = post.body.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
  await client.query(`INSERT INTO "Revisions" (_id,"documentId","collectionName","fieldName","editedAt",version,"wordCount","changeMetrics",html,"userId","originalContents") VALUES ($1,$2,'Posts','contents',$3,'1.0.0',$4,'{}',$5,$6,$7) ON CONFLICT (_id) DO NOTHING`, [revision,post.id,when,words,post.body,user,JSON.stringify({type:'html',data:post.body})]);
  await client.query(`INSERT INTO "Posts" (_id,slug,title,"postedAt","lastCommentedAt",status,"isFuture","userId","maxBaseScore","contents_latest",question,"authorIsUnreviewed","frontpageDate") VALUES ($1,$2,$3,$4,$4,2,false,$5,0,$6,$7,false,$4) ON CONFLICT (_id) DO NOTHING`, [post.id,post.slug,post.title,when,user,revision,post.question]);
}
await client.end();
console.log(`Loaded ${examples.length} clearly labeled local example discussions. No votes or user activity were fabricated.`);
