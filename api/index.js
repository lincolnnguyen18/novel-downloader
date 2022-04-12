import express from 'express';
import fetch from 'node-fetch';
import mysql from 'mysql2';
import cors from 'cors';
import JSSoup from 'jssoup';
import htmlToFormattedText from "html-to-formatted-text";

const conn = mysql.createConnection({
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
  let pieces = json[0];
  let translated = [];
  let original = '';
  let result = '';
  for (let i = 0; i < pieces.length; i++) {
    translated.push(pieces[i][0].trim());
    original += pieces[i][1].trim();
    if (pieces[i][0].includes('\n') && original.trim().length > 0 || i == pieces.length - 1 && original.trim().length > 0) {
      result += `${original}\n${translated.join(' ')}\n`;
      translated = [];
      original = '';
    }
  }
  return result.trim();
}

const ping = () => {
  conn.query('SELECT 1');
}
ping();
setInterval(() => {
  ping();
}, 60000);

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const router = express.Router();

router.post('/add-novel', (req, res) => {
  const { url } = req.body;
  // remove all slashes from end of url
  const urlWithoutSlashes = url.replace(/\/+$/, '');
  console.log(urlWithoutSlashes);
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
        "error": "No chapters found"
      });
    } else {
      let numChapters = chapters.getText().split('/')[1];
      let title = soup.find('a', {'class': 'margin_l10r20'}).getText().trim();
      let translatedTitle = await translate(title);
      soup.find('div', {'class': 'novel_bn'}).replaceWith('');
      soup.find('div', {'class': 'novel_bn'}).replaceWith('');
      let toTranslate = soup.find('div', {'id': 'novel_color'}).prettify();
      toTranslate = htmlToFormattedText(toTranslate);
      toTranslate = toTranslate.replace(/^\s*[\r\n]/gm, '');
      // console.log(toTranslate);
      console.log('success')
      conn.execute(`CALL add_novel(?, ?, ?, ?)`, [translatedTitle, numChapters, url, toTranslate], (err, results, fields) => {
        if (err) {
          console.log(err);
          res.json({
            "error": "Error adding novel"
          });
        } else {
          res.json({
            "success": "Novel added"
          });
        }
      });
    }
  });
});

// CREATE PROCEDURE get_novels(_continue_id INT, _limit INT) BEGIN
//   SELECT id, title, downloaded_chaps, total_chaps, url FROM novel WHERE id > _continue_id ORDER BY id DESC LIMIT _limit;
// END//

router.get('/get-novels', (req, res) => {
  const { continue_id, limit } = req.query;
  console.log(continue_id, limit);
  if (continue_id) {
    conn.execute(`CALL get_novels(?, ?)`, [continue_id, limit], (err, results, fields) => {
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
    conn.execute(`CALL get_novels_init(?)`, [limit], (err, results, fields) => {
      if (err) {
        console.log(err);
        res.json({
          "error": "Error getting novels"
        });
      } else {
        console.log(results[0]);
        res.json(results[0]);
      }
    });
  }
});

app.use('/api', router);
const port = 3124;
app.listen(port, () => console.log(`Listening on port ${port}`));