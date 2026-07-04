import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('./site', import.meta.url).pathname;
const PORT = Number(process.env.PORT) || 5129;
// Set API_ORIGIN (e.g. https://ryz129.tcilan.website or http://backend:3000) to proxy
// /api/* to a real backend instead of serving the built-in demo fixtures.
const API_ORIGIN = process.env.API_ORIGIN || '';

const MEMBERS = [
  { id: 2, username: 'Captain', role: 'r4', primary_type: 'Aircraft', play_level: 'semi-competitive', vac_start: null, vac_end: null, total_power: 201.5, a_squad_power: 95 },
  { id: 5, username: 'Soldier3', role: 'r1', primary_type: 'Missile', play_level: 'casual', vac_start: null, vac_end: null, total_power: 139.9, a_squad_power: 63.6 },
  { id: 6, username: 'Sup3rS0nicX', role: 'r5', primary_type: 'Tank', play_level: 'casual', vac_start: '2026-07-04', vac_end: '2026-07-06', total_power: 151.8, a_squad_power: 56.5 },
  { id: 4, username: 'Soldier2', role: 'r2', primary_type: 'Aircraft', play_level: 'semi-competitive', vac_start: null, vac_end: null, total_power: 123.9, a_squad_power: 56.3 },
  { id: 3, username: 'Soldier1', role: 'r3', primary_type: 'Aircraft', play_level: 'casual', vac_start: null, vac_end: null, total_power: 79.4, a_squad_power: 36.1 },
  { id: 8, username: 'Loki Thor', role: 'r3', primary_type: null, play_level: 'casual', vac_start: null, vac_end: null, total_power: 0, a_squad_power: 0 },
];

const USER = { id: 6, username: 'Sup3rS0nicX', role: 'r5', primary_type: 'Tank', play_level: 'casual' };

const SQUADS = [
  { id: 1, user_id: 6, label: 'A', unit_type: 'Tank', total_power: 56.5, is_active: 1 },
  { id: 2, user_id: 6, label: 'B', unit_type: 'Missile', total_power: 48.2, is_active: 1 },
  { id: 3, user_id: 6, label: 'C', unit_type: 'Aircraft', total_power: 30.1, is_active: 1 },
  { id: 4, user_id: 6, label: 'D', unit_type: 'Tank', total_power: 17, is_active: 0 },
];

const ALLIANCE = {
  name: 'RyZ s129',
  slogan: 'Are people still using this?',
  totalPower: 696.5,
  aSquadPower: 307.5,
  memberCount: 6,
  typeDistribution: { Tank: 1, Missile: 1, Aircraft: 3 },
  topPerType: {
    Tank: { username: 'Sup3rS0nicX', total_power: 56.5 },
    Missile: { username: 'Soldier3', total_power: 63.6 },
    Aircraft: { username: 'Captain', total_power: 95 },
  },
  members: MEMBERS,
};

const GROWTH = [
  { snapshot_date: '2026-06-27', Tank: 210.4, Missile: 231.9, Aircraft: 461.2, total_power: 2210.3 },
  { snapshot_date: '2026-07-04', Tank: 240.2, Missile: 249.3, Aircraft: 498.7, total_power: 2408.9 },
];

function api(method, path) {
  if (path === '/api/auth/login' && method === 'POST')
    return { status: 200, body: { token: 'mock-token', user: USER } };
  if (path === '/api/auth/me') return { status: 200, body: USER };
  if (path === '/api/alliance') return { status: 200, body: ALLIANCE };
  if (path === '/api/alliance/growth') return { status: 200, body: GROWTH };
  if (path === '/api/profile' && method === 'GET') return { status: 200, body: { profile: USER } };
  if (path === '/api/profile') return { status: 200, body: { ok: true } };
  if (path === '/api/squads' && method === 'GET') return { status: 200, body: SQUADS };
  if (path === '/api/squads') return { status: 200, body: { ok: true } };
  if (path === '/api/vacations' && method === 'GET') return { status: 200, body: [] };
  if (path.startsWith('/api/vacations')) return { status: 200, body: { ok: true } };
  if (path.startsWith('/api/members/')) {
    const username = decodeURIComponent(path.split('/')[3] ?? '');
    const member = MEMBERS.find(m => m.username === username);
    if (!member) return { status: 404, body: { error: 'Not found' } };
    if (path.endsWith('/snapshots'))
      return { status: 200, body: GROWTH.map(g => ({ snapshot_date: g.snapshot_date, total_power: member.total_power, a_squad_power: member.a_squad_power })) };
    return { status: 200, body: { ...member, squads: SQUADS } };
  }
  if (path.startsWith('/api/draw/eligible')) return { status: 200, body: MEMBERS.filter(m => m.total_power > 0) };
  if (path === '/api/draw/history') return { status: 200, body: [] };
  if (path === '/api/draw/spin') return { status: 200, body: { winner: MEMBERS[0] } };
  if (path === '/api/admin/secrets') return { status: 200, body: { r4_secret: 'demo', r5_secret: 'demo' } };
  if (path === '/api/admin/users') return { status: 200, body: MEMBERS };
  if (path.startsWith('/api/admin/')) return { status: 200, body: { ok: true } };
  return { status: 404, body: { error: 'Not found' } };
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  if (path.startsWith('/api')) {
    if (API_ORIGIN) {
      try {
        const body = ['GET', 'HEAD'].includes(req.method) ? undefined
          : await new Promise((ok, err) => {
              const chunks = [];
              req.on('data', (c) => chunks.push(c));
              req.on('end', () => ok(Buffer.concat(chunks)));
              req.on('error', err);
            });
        const upstream = await fetch(API_ORIGIN + req.url, {
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] ?? 'application/json',
            ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
          },
          body,
        });
        res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' });
        return res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch (e) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Upstream unreachable: ${e.message}` }));
      }
    }
    const hit = api(req.method, path);
    res.writeHead(hit.status, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(hit.body));
  }

  const file = normalize(join(ROOT, path === '/' ? 'index.html' : path));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    // SPA fallback for client-side routes
    const index = await readFile(join(ROOT, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(index);
  }
}).listen(PORT, () => console.log(
  `RYZ WAR ROOM on http://localhost:${PORT} — API: ${API_ORIGIN || 'built-in demo fixtures'}`));
