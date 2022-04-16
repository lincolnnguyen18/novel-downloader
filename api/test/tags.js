import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
import { JSDOM } from 'jsdom';

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'pass123',
  database: 'novel_downloader',
  multipleStatements: true
});

const timer = ms => new Promise(res => setTimeout(res, ms))

const translate = async (text) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=` + encodeURIComponent(text);
  const res = await fetch(url);
  const json = await res.json();
  // console.log(json);
  let lang = json[2];
  let pieces = json[0];
  let translated = [];
  let original = [];
  let result = '';
  for (let i = 0; i < pieces.length; i++) {
    translated.push(pieces[i][0]);
    original.push(pieces[i][1]);
    // if (lang != 'ja' && lang != 'zh' && lang != 'ko')
    //   original += ' ';
    // if (pieces[i][0].includes('\n') && original.trim().length > 0 && original.trim().length > 0 || pieces.length == 1) {
    //   result += `${original}\n${translated.join(' ')}\n`;
    //   translated = [];
    //   original = '';
    // } else if (i == pieces.length - 1) {
    //   return 
    // }
  }
  return { original, translated, lang };
}

const translateLong = async (chunks, callback) => {
  let original = [];
  let translated = [];
  let lang = null;
  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];
    await translate(chunk).then(res => {
      if (lang != 'ja' && lang != 'zh' && lang != 'ko')
        original.push(res.original.join(' '));
      else
        original.push(res.original.join(''));
      translated.push(res.translated.join(' '));
      lang = res.lang;
    });
    let min = 100;
    let max = 500;
    let time = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`Progress: ${(i + 1) / chunks.length * 100}%`);
    await timer(time);
  }
  callback({ original, translated, lang });
}

const splitText = (data) => {
  // split based on 。 and \n
  let chunks = [];
  let chunk = '';
  let stopChars = ['\n', '「', '"', '»', '«', '」', '。', '.', ','];
  for (let i = 0; i < data.length; i++) {
    chunk += data[i];
    if ((chunk.length > 600 && (stopChars.includes(data[i])) || i == (data.length - 1))) {
      chunks.push(chunk);
      chunk = '';
    } else if (chunk.length > 700) {
      // find index of first stopChar in reverse
      for (let j = i; j > i; j--) {
        if (stopChars.includes(data[j])) {
          chunks.push(chunk.substring(i, j));
          chunk = '';
          break;
        }
      }
      for (let j = i; j > i; j--) {
        if (data[j] == ' ') {
          chunks.push(chunk.substring(i, j));
          chunk = '';
          break;
        }
      }
      chunks.push(chunk);
      chunk = '';
    }
  }
  return chunks;
}

const joinLines = (original, translated) => {
  original = original.join('').split('\n');
  original = original.map(line => line.replace(/^\s+/, ''));
  // console.log(original);
  translated = translated.join('').split('\n');
  translated = translated.map(line => line.replace(/^\s+/, ''));
  // console.log(translated);
  let combined = "";
  for (let i = 0; i < original.length; i++) {
    combined += original[i] + '\n' + translated[i] + '\n';
  }
  return combined;
}

const getNovelSynopTags = async (url) => {
  let ncode = url.split('/').pop();
  let urlWithoutNcode = url.split('/').slice(0, -1).join('/');
  let infoUrl = `${urlWithoutNcode}/novelview/infotop/ncode/${ncode}/`;
  return await fetch(infoUrl, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en,ja;q=0.9",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "ks2=b2r7kbr1zqw; sasieno=0; novellayout=0; fix_menu_bar=1; _ga=GA1.2.860378630.1639432468; ses=es507agid6a4uuu43rbh52sbrb; over18=yes; autologin=1095259%3C%3E5fbd5d1d63f3dfef5e35de54df590fd777d78392f1d286b901b3630687a1375c; fontsize=100; lineheight=150; nlist1=nuuw.1-v5lq.17-yzjr.1-bba7.14-wcjt.2e-1r6q.10-pyd1.3-vqnk.1m-6ifs.h-k2m3.e-2w4l.8-zpyk.2u-vvh7.3-hd8t.8-9hjr.x-wg43.d-vx8c.6-nsy8.k-13efl.w-11yzz.7-11bjf.6x-143kr.g-12bjv.1h-ysoq.q-dmfy.1q-qpfr.24-wo22.7-cpjb.4-5p7z.6-e3mb.u; _gid=GA1.2.522332950.1649663626; adr_id=XXApTVxvybzO8GWZb9WaUn725RbNFx7XP0ykcckZFfG369Ta; nlist3=15z9v.2-10dor.5-wcr2.6-hzrv.7-z4z2.9-fwzd.11-p0ru.9-umov.4-xohm.1q-10c98.0-otyj.1-ucr1.0-spvi.j-tt4g.1-rzu2.9-zl1a.2-y9qx.f-11gp0.5-vdez.d-xzp4.6-x0mn.5-xrkl.7-cvyy.c-8e1e.g-159vj.4-15x2w.5-sujw.m-14a8c.4n-wxi.3-bmig.0",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  })
  .then(res => res.text())
  .then(body => {
    // console.log(url);
    const frag = JSDOM.fragment(body);
    const tags = frag.querySelector('#noveltable1 > tbody > tr:nth-child(3) > td').textContent.split(/[\n\s]+/).filter(x => x.length > 0);
    let synop = frag.querySelector('#noveltable1 > tbody > tr:nth-child(1) > td').textContent;
    // remove all empty leading whitespace
    synop = synop.replace(/^\s+/, '');
    // remove all lines with only whitespace
    synop = synop.split('\n').filter(x => x.replace(/\s/g, '').length > 0).join('\n');
    return { tags, synop };
  });
}

// conn.execute('SELECT id, url FROM NOVEL', async (err, rows) => {
//   for (const row of rows) {
//     let url = row.url;
//     let novelId = row.id;
//     if (url) {
//       // console.log(row.url);
//       const { tags, synop } = await getNovelSynopTags(url);
//       for ( let tag of tags ) {
//         const { original, translated } = await translate(tag);
//         let combined = [original, translated].join('\n');
//         console.log(combined);
//         await timer(500);
//         conn.execute('CALL check_tag(?)', [combined], (err, rows) => {
//           if (err) {
//             console.log(err);
//           } else if (!rows[0][0].tag_exists) {
//             conn.query('CALL add_tag(?)', [combined], (err, rows) => {
//               if (err) {
//                 console.log(err);
//               } else {
//                 console.log(`Added tag: ${combined}`);
//                 conn.query('CALL add_tag_to_novel(?, ?)', [novelId, rows.lastId], (err, rows) => {
//                   if (err) {
//                     console.log(err);
//                   } else {
//                     console.log(`Added tag to novel: ${combined}`);
//                   }
//                 });
//               }
//             });
//           } else {
//             console.log(`Tag already exists: ${combined}`);
//             conn.query('CALL add_tag_to_novel(?, ?)', [novelId, rows.lastId], (err, rows) => {
//               if (err) {
//                 console.log(err);
//               } else {
//                 console.log(`Added tag to novel: ${combined}`);
//               }
//             });
//           }
//         });
//       }
//       // let chunks = splitText(synop);
//       // await translateLong(chunks, (res) => {
//       //   const { original, translated, lang } = res;
//       //   const combined = joinLines(original, translated);
//       //   console.log(combined);
//       // });
//       break;
//     }
//   };
// });

async function main() {
  // console.log(conn)
  const [rows, fields] = await conn.execute('SELECT id, url FROM NOVEL');
  for (const row of rows) {
    let id = row.id;
    if (row.url) {
      const { tags, synop } = await getNovelSynopTags(row.url);
      for ( let tag of tags ) {
        let { original, translated } = await translate(tag);
        let combined = [original, translated].join('\n');
        console.log(combined)
        await timer(500);
        const [rows, fields] = await conn.query('SELECT id FROM TAG WHERE name = ?', [combined]);
        if (rows.length === 0) {
          await conn.query('CALL add_tag(?)', [combined]);
        }
        console.log(`combined: ${combined}`);
        try { await conn.query('CALL add_tag_to_novel(?, ?)', [id, combined]);}
        catch (err) { }
      }
      let chunks = splitText(synop);
      await translateLong(chunks, (res) => {
        const { original, translated, lang } = res;
        const combined = joinLines(original, translated);
        conn.query('UPDATE Novel SET synopsis = ? WHERE id = ?', [combined, id]);
      });
    }
    // break;
  }
}
main();