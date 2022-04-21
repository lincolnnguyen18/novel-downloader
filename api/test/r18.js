import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'pass123',
  database: 'novel_downloader',
  multipleStatements: true
});

async function main() {
  const [rows, fields] = await conn.execute('SELECT id, url FROM NOVEL');
  for (const row of rows) {
    let id = row.id;
    if (row.url) {
      console.log(row.url, id);
      if (row.url.includes('novel18')) {
        await conn.query('CALL add_tag_to_novel(?, ?)', [id, "novel18"]);
      }




      // const { tags, synop } = await getNovelSynopTags(row.url);
      // for ( let tag of tags ) {
      //   let { original, translated } = await translate(tag);
      //   let combined = [original, translated].join('\n');
      //   console.log(combined)
      //   await timer(500);
      //   const [rows, fields] = await conn.query('SELECT id FROM TAG WHERE name = ?', [combined]);
      //   if (rows.length === 0) {
      //     await conn.query('CALL add_tag(?)', [combined]);
      //   }
      //   console.log(`combined: ${combined}`);
      //   try { await conn.query('CALL add_tag_to_novel(?, ?)', [id, combined]);}
      //   catch (err) { }
      // }
      // let chunks = splitText(synop);
      // await translateLong(chunks, (res) => {
      //   const { original, translated, lang } = res;
      //   const combined = joinLines(original, translated);
      //   conn.query('UPDATE Novel SET synopsis = ? WHERE id = ?', [combined, id]);
      // });
    }
    // break;
  }
}
main();