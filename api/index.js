import express from 'express';
import fetch from 'node-fetch';
import mysql from 'mysql2';
import mysql2 from 'mysql2/promise';
import cors from 'cors';
import JSSoup from 'jssoup';
import htmlToFormattedText from "html-to-formatted-text";
import sanitize from 'sanitize-filename';
import { JSDOM } from 'jsdom';

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'pass123',
  database: 'novel_downloader',
  multipleStatements: true
});

(async () => {
  const conn2 = await mysql2.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'pass123',
    database: 'novel_downloader',
    multipleStatements: true
  });

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

const timer = ms => new Promise(res => setTimeout(res, ms))

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

const getChapterText = async (urlWithoutSlashes, chapNum) => {
  return await fetch(urlWithoutSlashes +`/${chapNum}`, {
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
    let soup = new JSSoup.default(body);
    let chapters = soup.find('div', {'id': 'novel_no'});
    if (!chapters) {
      return "";
    } else {
      soup.findAll('div', {'class': 'novel_bn'}).forEach(e => {
        e.replaceWith('');
      });
      soup.findAll('ruby').forEach(e => {
        let word = e.find('rb').text;
        let reading = e.find('rt').text;
        e.replaceWith(`${word}(${reading})`);
      });
      soup.findAll('script').forEach(e => {
        e.replaceWith('');
      });
      soup.findAll('p').forEach(e => {
        // remove all newlines
        e.replaceWith(e.text.replace(/\n/g, ''));
      });
      let toTranslate = soup.find('div', {'id': 'novel_color'}).prettify();
      toTranslate = htmlToFormattedText(toTranslate);
      toTranslate = toTranslate.replace(/^\s*[\r\n]/gm, '');
      return toTranslate;
    }
  });
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

const ping = () => {
  conn.query('SELECT 1');
}
ping();
setInterval(() => {
  ping();
}, 60000);

const app = express();
app.use(express.json({limit: '2gb'}));
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '2gb' }));
app.use(express.static('../vue/dist'));

app.get('/', (req, res) => {
  res.sendFile('../vue/dist/index.html');
});

const router = express.Router();

router.post('/delete-novel', async (req, res) => {
  let { id } = req.query;
  console.log(`Deleting novel ${id}`);
  conn.execute('CALL delete_novel(?)', [id], (err, rows, fields) => {
    if (err) {
      console.log(err);
      res.json({ "error": "An error has occurred" });
    } else {
      res.json({ "success": "Novel deleted" });
    }
  });
});

router.post('/add-novel', async (req, res) => {
  const { url } = req.body;
  // remove all slashes from end of url
  const urlWithoutSlashes = url.replace(/\/+$/, '');
  // console.log(urlWithoutSlashes);
  conn.execute('CALL check_link(?)', [urlWithoutSlashes], (err, rows, fields) => {
    if (err) {
      console.log(err);
      res.json({ "error": "An error has occurred" });
    } else {
      if (rows[0][0].url_exists) {
        console.log(rows[0][0]);
        res.json({ "error": "Novel already exists" });
      } else {
        fetch(urlWithoutSlashes +'/1', {
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
        .then(async body => {
          let soup = new JSSoup.default(body);
          let chapters = soup.find('div', {'id': 'novel_no'});
          if (!chapters) {
            res.json({
              "error": "Invalid link"
            });
          } else {
            let numChapters = chapters.getText().split('/')[1];
            let title = soup.find('a', {'class': 'margin_l10r20'});
            if (!title) title = soup.find('a', {'class': 'margin_r20'});
            title = title.getText().trim();
            let { original, translated, lang } = await translate(title);
            soup.find('div', {'class': 'novel_bn'}).replaceWith('');
            soup.find('div', {'class': 'novel_bn'}).replaceWith('');
            // let toTranslate = soup.find('div', {'id': 'novel_color'}).prettify();
            // toTranslate = htmlToFormattedText(toTranslate);
            // toTranslate = toTranslate.replace(/^\s*[\r\n]/gm, '');
            // toTranslate = toTranslate.replace(/\s*\n\s*\(\s*\n\s*/g, '(');
            // toTranslate = toTranslate.replace(/\s*\n\s*\)\s*\n\s*/g, ')');
            console.log('success')
            let textToAppend = `${urlWithoutSlashes}\n${original}\n${translated}\n`;
            conn.query(`CALL add_novel(?, ?, ?, ?)`, [`${original}\n${translated}`, numChapters, urlWithoutSlashes, textToAppend], async (err, results, fields) => {
              let [rows] = await conn2.query(`SELECT id FROM novel WHERE url = ?`, [urlWithoutSlashes]);
              // console.log(rows)
              let id = rows[0].id
              // console.log(`ID = ${id}`);
              if (err) {
                console.log(err);
                res.json({
                  "error": "Error adding novel"
                });
              } else {
                const { tags, synop } = await getNovelSynopTags(urlWithoutSlashes);
                for ( let tag of tags ) {
                  let { original, translated } = await translate(tag);
                  let combined = [original, translated].join('\n');
                  // console.log(combined)
                  await timer(10);
                  const [rows, fields] = await conn2.query('SELECT id FROM TAG WHERE name = ?', [combined]);
                  if (rows.length === 0) {
                    await conn2.query('CALL add_tag(?)', [combined]);
                  }
                  // console.log(`combined: ${combined}`);
                  try { await conn2.query('CALL add_tag_to_novel(?, ?)', [id, combined]);}
                  catch (err) { }
                }
                let chunks = splitText(synop);
                await translateLong(chunks, async (res) => {
                  const { original, translated, lang } = res;
                  const combined = joinLines(original, translated);
                  await conn2.query('UPDATE Novel SET synopsis = ? WHERE id = ?', [combined, id]);
                });
                res.json({
                  "success": "Novel added"
                });
              }
            });
          }
        })
        .catch(err => {
          console.log(err);
          res.json({
            "error": "Error fetching novel"
          });
        });
      }
    }
  });
});

// CREATE PROCEDURE add_custom_novel(_title TEXT, _text LONGTEXT, _total_chaps INT, _translated LONGTEXT) BEGIN
//   INSERT INTO novel(title, toTranslate, total_chaps, translated, url) VALUES(_title, _text, _total_chaps, _translated, "");
// END//

router.post('/add-custom-novel', async (req, res) => {
  let { title, text } = req.body;
  // remove empty lines from text
  text = text.replace(/^\s*[\r\n]/gm, '');
  let { original, translated } = await translate(title);
  let totalChaps = Math.floor(text.length / 7000);
  if (totalChaps == 0) totalChaps = 1;
  // console.log(translatedTitle, totalChaps);
  conn.execute(`CALL check_title(?)`, [`${original}\n${translated}`], (err, results, fields) => {
    if (err) {
      console.log(err);
      res.json({ "error": "Error checking title" });
    } else {
      if (results[0][0].title_exists) {
        res.json({ "error": "Title already exists" });
      } else {
        conn.execute(`CALL add_custom_novel(?, ?, ?, ?)`, [`${original}\n${translated}`, text, totalChaps, `${original}\n${translated}\n`], (err, results, fields) => {
          if (err) {
            console.log(err);
            res.json({ "error": "Error adding novel" });
          } else {
            res.json({ "success": "Novel added" });
          }
        });
      }
    }
  });
});

const truncateString = (str, num) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num);
};

router.get('/get-novel-text', (req, res) => {
  const { id, title } = req.query;
  console.log(id, title);
  conn.execute(`CALL get_novel_text(?)`, [id], (err, results, fields) => {
    if (err) {
      console.log(err);
      res.json({ "error": "Error getting novel text" });
    } else {
      let filename = truncateString(sanitize(title), 50);
      filename.replace(/\s/g, '_');
      // replace all commas with underscores
      filename = filename.replace(/,/g, '_');
      // replace all dashes with underscores
      filename = filename.replace(/-/g, '_');
      // replace all periods with underscores
      filename = filename.replace(/\./g, '_');
      filename += '.txt';
      res.set({"Content-Disposition":"attachment; filename=" + filename});
      res.set({"Content-Type":"text/plain"});
      res.send(results[0][0]['translated']);
    }
  });
});

  router.get('/novel-tags/:id', async (req, res) => {
    const { id } = req.params;
    const [rows, fields] = await conn2.execute(`CALL get_novel_tags(?)`, [id]);
    let tags = rows[0].map(row => row.name);
    return res.json(tags);
  });
  router.get('/synopsis/:id', async (req, res) => {
    const { id } = req.params;
    const [rows, fields] = await conn2.execute(`SELECT synopsis FROM novel WHERE id = ?`, [id]);
    return res.json({synopsis: rows[0].synopsis});
  });
  

router.get('/view-novel-text', (req, res) => {
  const { id } = req.query;
  conn.execute(`CALL get_novel_text(?)`, [id], (err, results, fields) => {
    if (err) {
      console.log(err);
      res.json({ "error": "Error getting novel text" });
    } else {
      res.json({ "text": results[0][0]['translated'] });
    }
  });
});

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

router.post('/download-novel', async (req, res) => {
  const { id, url, curChap, lastChap } = req.body;
  if (url) {
    console.log(id, url, curChap, lastChap);
    let toTranslate = await getChapterText(url, curChap + 1);
    if (toTranslate) {
      let chunks = splitText(toTranslate);
      // chunks.forEach(chunk => {
      //   console.log(chunk);
      //   console.log('----------------');
      // });
      translateLong(chunks, (data) => {
        let { original, translated, lang } = data;
        let combined = joinLines(original, translated);
        console.log('done!')
        // if (translated[translated.length - 1] != '\n') {
        //   translated += '\n';
        // }
        conn.execute(`CALL append_to_translated(?, ?, ?)`, [id, combined, curChap + 1], (err, results, fields) => {
          if (err) {
          console.log(err);
            res.json({
              "error": "Error translating novel"
            });
          } else {
            res.json({
              "success": "Novel translated",
              "length": combined.length
            });
          }
        });
      });
    } else {
      res.json({ "error": "Error downloading novel" });
    }
  } else {
    conn.execute(`CALL get_to_translate(?)`, [id], (err, results, fields) => {
      if (err) {
        console.log(err);
        res.json({ "error": "Error getting text to translate" });
      } else {
        let toTranslate = results[0][0]['toTranslate'];
        // console.log(`toTranslate: ${toTranslate}`);
        let translatedLength = results[0][0]['translated_length'];
        let initToTranslateLength = results[0][0]['initToTranslateLength'];
        let toTranslatedTranslatedLength = results[0][0]['toTranslatedTranslatedLength'];
        let chunks = splitText(toTranslate);
        let chunksToTranslate = [];
        let chunksLeft = [];
        let totalChars = 0;
        let i;
        for (i = 0 ; i < chunks.length; i++) {
          let chunk = chunks[i];
          chunksToTranslate.push(chunk);
          totalChars += chunk.length;
          // console.log(chunk);
          // console.log('----------------');
          if (totalChars > 7000) {
            break;
          }
        };
        // console.log(`first i: ${i}`);
        let chunksToTranslateLength = chunksToTranslate.join('').length;
        // console.log(chunksToTranslate.join('').slice(-30));
        // console.log(`second i: ${i}`);
        i += 1;
        for (i = i; i < chunks.length; i++) {
          let chunk = chunks[i];
          chunksLeft.push(chunk);
        }
        let textToTranslateLeft = chunksLeft.join('');
        // console.log(textToTranslateLeft.substring(0, 30));
        translateLong(chunksToTranslate, (data) => {
          let { original, translated, lang } = data;
          // console.log(original);
          let combined = joinLines(original, translated);
          console.log('done!')
          // if (translated[translated.length - 1] != '\n') {
          //   translated += '\n';
          // }
          let curChap = Math.floor(((initToTranslateLength - textToTranslateLeft.length) / initToTranslateLength) * lastChap);
          console.log(`curChap: ${curChap}`);
          if (!textToTranslateLeft) curChap = lastChap;
          conn.execute(`CALL append_to_translated(?, ?, ?)`, [id, combined, curChap], (err, results, fields) => {
            if (err) {
            console.log(err);
              res.json({ "error": "Error translating text" });
            } else {
              res.json({
                "success": "Novel added",
                "length": combined.length,
                "curChap": curChap
              });
            }
          });
          conn.execute('CALL set_to_translate(?, ?, ?)', [id, textToTranslateLeft, combined.length], (err, results, fields) => { });
        });
      }
    });
  }
});

router.get('/get-novels', (req, res) => {
  let { continue_id, limit, search } = req.query;
  if (!search) search = '';
  // console.log(continue_id, limit);
  if (continue_id) {
    conn.execute(`CALL get_novels(?, ?, ?)`, [continue_id, limit, search], (err, results, fields) => {
      if (err) {
        console.log(err);
        res.json({
          "error": "Error getting novels"
        });
      } else {
        res.json(results[0]);
      }
    });
  } else {
    conn.execute(`CALL get_novels_init(?, ?)`, [limit, search], (err, results, fields) => {
      if (err) {
        console.log(err);
        res.json({
          "error": "Error getting novels"
        });
      } else {
        res.json(results[0]);
      }
    });
  }
});

app.use('/api', router);
const port = 6001;
app.listen(port, () => console.log(`Listening on port ${port}`));

})();