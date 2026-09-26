import { list } from "@vercel/blob";
async function main() {
  let cursor: string | undefined;
  const all: { url: string; pathname: string; uploadedAt: Date }[] = [];
  do {
    const r = await list({ cursor, limit: 1000 });
    all.push(...r.blobs);
    cursor = r.cursor;
  } while (cursor);
  for (const b of all) console.log(b.uploadedAt.toISOString(), b.pathname, "||", b.url);
}
main();
