import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { PACKS } from './src/packs.js';
import { rooms, createRoom, addPlayer, castVote, hostAction, viewFor, sweepRooms, GameError, QUALIFIER_OPTIONS, totalMatches } from './src/game.js';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const PAGES = { '/': 'index.html', '/host': 'host.html', '/join': 'play.html' };

const listeners = new Map(); // code -> Set<{res, role, pid}>

function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const i of list || []) {
    if (i.family === 'IPv4' && !i.internal) out.push(`http://${i.address}:${PORT}`);
  }
  // prefer typical home-network ranges first
  return out.sort((a, b) => (/\/\/(192\.168|10\.)/.test(b) ? 1 : 0) - (/\/\/(192\.168|10\.)/.test(a) ? 1 : 0));
}

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function readBody(req) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > 20_000) throw new GameError('Request too large.'); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { throw new GameError('Bad request.'); }
}

function hookRoom(room) {
  let queued = false;
  room.notify = () => {
    if (queued) return; queued = true;
    queueMicrotask(() => { queued = false; broadcast(room); });
  };
}

function broadcast(room) {
  for (const l of listeners.get(room.code) || []) {
    try { l.res.write(`data: ${JSON.stringify(viewFor(room, l.role, l.pid))}\n\n`); } catch { /* closed */ }
  }
}

function getRoom(code) {
  const room = rooms.get(String(code || '').toUpperCase().trim());
  if (!room) throw new GameError('Room not found. Check the code?');
  return room;
}
const needHost = (room, key) => { if (key !== room.hostKey) throw new GameError('Host only.'); };

async function api(req, res, url) {
  const route = url.pathname;
  if (req.method === 'GET') {
    if (route === '/api/exists') return rooms.has(String(url.searchParams.get('code') || '').toUpperCase()) ? send(res, 200, { ok: true }) : send(res, 404, { error: 'gone' });
    if (route === '/api/info') return send(res, 200, { urls: lanUrls(), port: PORT });
    if (route === '/api/packs') return send(res, 200, { packs: PACKS.map(({ id, emoji, name, desc, spotlight }) => ({ id, emoji, name, desc, live: !!spotlight })), qualifiers: QUALIFIER_OPTIONS.map((q) => ({ q, total: totalMatches(q) })) });
    if (route === '/api/qr') {
      const text = url.searchParams.get('text') || '';
      if (!text || text.length > 300) return send(res, 400, { error: 'bad text' });
      return send(res, 200, await QRCode.toString(text, { type: 'svg', margin: 1, color: { dark: '#0b0b12', light: '#ffffff' } }), 'image/svg+xml');
    }
    if (route === '/api/events') {
      const room = getRoom(url.searchParams.get('code'));
      const role = url.searchParams.get('role') === 'host' ? 'host' : 'player';
      const pid = url.searchParams.get('pid');
      if (role === 'host') needHost(room, url.searchParams.get('key'));
      else if (!room.players.has(pid)) throw new GameError('Unknown player.');
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 1500\n\n');
      const l = { res, role, pid };
      if (!listeners.has(room.code)) listeners.set(room.code, new Set());
      listeners.get(room.code).add(l);
      if (role === 'player') { (room.online ||= new Set()).add(pid); room.notify?.(); }
      res.write(`data: ${JSON.stringify(viewFor(room, role, pid))}\n\n`);
      const ping = setInterval(() => res.write(': ping\n\n'), 20000);
      req.on('close', () => {
        clearInterval(ping);
        listeners.get(room.code)?.delete(l);
        // a phone counts as offline once its last connection drops
        if (role === 'player' && ![...(listeners.get(room.code) || [])].some((x) => x.pid === pid)) { room.online?.delete(pid); room.notify?.(); }
      });
      return;
    }
    return send(res, 404, { error: 'Not found' });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const body = await readBody(req);
  if (route === '/api/create') {
    const room = createRoom(body);
    hookRoom(room);
    return send(res, 200, { code: room.code, key: room.hostKey, hostPid: room.hostPid || null });
  }
  if (route === '/api/join') {
    const room = getRoom(body.code);
    const p = addPlayer(room, body.name);
    return send(res, 200, { pid: p.id, name: p.name, code: room.code });
  }
  if (route === '/api/vote') {
    const room = getRoom(body.code);
    castVote(room, body.pid, body.token, body.songId);
    return send(res, 200, { ok: true });
  }
  if (route === '/api/host') {
    const room = getRoom(body.code);
    needHost(room, body.key);
    hostAction(room, body.action, body).catch((e) => console.error(e));
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const file = PAGES[url.pathname] || path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
    const full = path.join(PUBLIC, file);
    if (!full.startsWith(PUBLIC) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(full).pipe(res);
  } catch (e) {
    if (e instanceof GameError) return send(res, 400, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'Server error' });
  }
});

setInterval(sweepRooms, 3600_000).unref();
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  AUX WARS is running\n');
  console.log(`  Host screen:  http://localhost:${PORT}/host`);
  for (const u of lanUrls()) console.log(`  On your Wi-Fi: ${u}  (phones join here)`);
  console.log('');
});
