/* ProjectOS 共享後端
   同時服務靜態前端 + 多人共用的資料 API。
   資料存於 data.json,revision 遞增偵測衝突。

   啟動: node server.js [port]   (預設 8090)
   - GET  /api/data       → 回傳 { rev, data }
   - POST /api/data       → body { data, baseRev } → 成功 { ok:true, rev, data }
                              若 baseRev != 目前 rev(他人已改過)回 409 衝突
   - 其餘路徑 → 靜態檔案(前端)
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const PORT = parseInt(process.argv[2] || process.env.PORT || '8090', 10);

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.ico':'image/x-icon',
  '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function now(){ return new Date().toISOString(); }
function log(...a){ console.log('['+now()+']', ...a); }

function readStore(){
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const o = JSON.parse(raw);
    if (o && Array.isArray(o.data)) return { rev: o.rev||0, data: o.data };
  } catch(e){}
  return { rev: 0, data: null };
}
function writeStore(data, rev){
  // 覆寫前把現有內容備份一份,避免誤刪/誤重置時無法回復
  try { if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, DATA_FILE + '.bak'); } catch(e){}
  fs.writeFileSync(DATA_FILE, JSON.stringify({ rev, data }));
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const route = url.pathname;

  if (route === '/api/data') {
    if (req.method === 'GET') {
      const s = readStore();
      res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
      res.end(JSON.stringify(s));
      return;
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body || '{}'); }
        catch(e){ res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({ ok:false, error:'bad json' })); return; }
        if (!Array.isArray(parsed.data)) {
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ ok:false, error:'invalid data' })); return;
        }
        const s = readStore();
        const baseRev = parseInt(parsed.baseRev, 10) || 0;
        if (s.rev !== baseRev) {           // 別人已改寫 → 衝突
          res.writeHead(409, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ ok:false, error:'conflict', rev:s.rev, data:s.data }));
          return;
        }
        const newRev = s.rev + 1;
        writeStore(parsed.data, newRev);
        log('SAVE rev', newRev);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ ok:true, rev:newRev, data:parsed.data }));
      });
      return;
    }
  }

  // 靜態檔案
  let filePath = decodeURIComponent(route);
  if (filePath === '/') filePath = '/index.html';
  filePath = path.normalize(path.join(ROOT, filePath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => log('ProjectOS shared server on http://0.0.0.0:'+PORT));
