import * as THREE from './vendor/three.module.min.js';
import * as DEMO from './demo-data.js';

/* ================= API ================= */
// Static mode: when no /api backend exists (e.g. GitHub Pages), answer from demo-data.js.
let staticMode = false;
const demoApi = (path) => {
  if (path === '/auth/me') return DEMO.USER;
  if (path === '/auth/login') return { token: 'demo', user: DEMO.USER };
  if (path === '/alliance') return DEMO.ALLIANCE;
  if (path === '/alliance/growth') return DEMO.GROWTH;
  if (path === '/squads') return DEMO.SQUADS;
  if (path === '/draw/spin') {
    const pool = DEMO.MEMBERS.filter((m) => m.total_power > 0);
    return { winner: pool[Math.floor(Math.random() * pool.length)] };
  }
  throw new Error('Not available in demo');
};
const api = async (path, opts = {}) => {
  if (staticMode) return demoApi(path);
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch('api' + path, { ...opts, headers }).catch(() => null);
  // No backend at all (network error) or a static host serving an HTML 404 → demo mode.
  if (!r || (!r.ok && (r.headers.get('content-type') || '').includes('text/html'))) {
    staticMode = true;
    return demoApi(path);
  }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
  return r.json();
};

/* ================= SVG library ================= */
const ICON = {
  tank: `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="16" width="24" height="8" rx="4" fill="currentColor" opacity="0.9"/><rect x="10" y="10" width="12" height="8" rx="2" fill="currentColor"/><rect x="20" y="12" width="11" height="3" rx="1.5" fill="currentColor"/><circle cx="9" cy="20" r="2" fill="#06090a"/><circle cx="16" cy="20" r="2" fill="#06090a"/><circle cx="23" cy="20" r="2" fill="#06090a"/></svg>`,
  missile: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 2c4 4 6 9 6 14l-6 4-6-4c0-5 2-10 6-14z" fill="currentColor"/><path d="M10 18l-4 8 7-3M22 18l4 8-7-3" fill="currentColor" opacity="0.7"/><circle cx="16" cy="11" r="2.4" fill="#06090a"/><path d="M14 22h4l-2 8z" fill="currentColor" opacity="0.5"/></svg>`,
  aircraft: `<svg viewBox="0 0 32 32" fill="none"><path d="M16 3l3 9 11 5v3l-11-2v6l4 3v3l-7-2-7 2v-3l4-3v-6L2 20v-3l11-5z" fill="currentColor"/></svg>`,
  radar: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--holo)" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" opacity="0.6"/><path d="M12 12L18 5" stroke-linecap="round"/><circle cx="12" cy="12" r="1.4" fill="var(--holo)"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--holo)" stroke-width="1.8"><path d="M3 20h18M5 16l4-5 4 3 6-8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  roster: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--holo)" stroke-width="1.8"><circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.6a3.4 3.4 0 010 6.8M17.5 14.4c2.1.8 3.5 2.9 3.5 5.6"/></svg>`,
  crate: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="1.8"><rect x="4" y="8" width="16" height="12" rx="1"/><path d="M4 12h16M12 8v12M8 8V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V8"/></svg>`,
  squad: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--holo)" stroke-width="1.8"><path d="M12 3l8 4v5c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V7z" stroke-linejoin="round"/><path d="M9 12l2 2 4-4.5"/></svg>`,
};

const rankInsignia = (role) => {
  const n = parseInt(role?.replace(/\D/g, '') || '1', 10);
  const color = n === 5 ? 'var(--gold)' : n === 4 ? 'var(--amber)' : 'var(--holo-dim)';
  let marks = '';
  for (let i = 0; i < Math.min(n, 5); i++) {
    const y = 27 - i * 4.5;
    marks += `<path d="M12 ${y}l8 ${-4} v3 l-8 4 l-8 -4 v-3 z" fill="${color}" opacity="${0.55 + i * 0.11}"/>`;
  }
  return `<svg viewBox="0 0 24 34">${marks}</svg>`;
};

/* ================= helpers ================= */
const fmtM = (v) => v >= 1000 ? (v / 1000).toFixed(2) + 'B' : v.toFixed(1) + 'M';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const CLS = { Tank: 'tank', Missile: 'missile', Aircraft: 'aircraft' };

function countUp(node, target, suffix = 'M', dur = 1400) {
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.innerHTML = `${(target * eased).toFixed(1)}<small>${suffix}</small>`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ================= three.js holo globe ================= */
function initHolo(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.6, 4.4);

  const holo = new THREE.Color('#3ef0c8');
  const group = new THREE.Group();
  scene.add(group);

  // wireframe globe
  const globe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 2),
    new THREE.MeshBasicMaterial({ color: holo, wireframe: true, transparent: true, opacity: 0.4 })
  );
  group.add(globe);

  // vertex points
  const pts = new THREE.Points(
    new THREE.IcosahedronGeometry(1.5, 2),
    new THREE.PointsMaterial({ color: holo, size: 0.035, transparent: true, opacity: 0.9 })
  );
  group.add(pts);

  // equator rings
  for (const [r, tilt, op] of [[1.9, 0.28, 0.5], [2.25, -0.15, 0.25]]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.008, 8, 96),
      new THREE.MeshBasicMaterial({ color: holo, transparent: true, opacity: op })
    );
    ring.rotation.x = Math.PI / 2 + tilt;
    group.add(ring);
  }

  // radar sweep plane
  const sweepGeo = new THREE.CircleGeometry(1.9, 48, 0, 0.9);
  const sweep = new THREE.Mesh(sweepGeo, new THREE.MeshBasicMaterial({
    color: holo, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
  }));
  sweep.rotation.x = -Math.PI / 2 + 0.28;
  group.add(sweep);

  // blips
  const blips = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 3 ? holo : new THREE.Color('#ffb03a') })
    );
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    b.position.setFromSphericalCoords(1.52, ph, th);
    blips.push(b);
    group.add(b);
  }

  let dragX = 0, vx = 0.0022, down = null;
  container.addEventListener('pointerdown', (e) => { down = e.clientX; }, { passive: true });
  addEventListener('pointermove', (e) => {
    if (down == null) return;
    dragX += (e.clientX - down) * 0.005; down = e.clientX;
  }, { passive: true });
  addEventListener('pointerup', () => { down = null; }, { passive: true });

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);
  new ResizeObserver(resize).observe(container); // container is display:none at init; fires once revealed

  renderer.setAnimationLoop((t) => {
    group.rotation.y += vx + (down != null ? 0 : dragX * 0.02);
    dragX *= 0.92;
    if (down != null) { group.rotation.y += dragX * 0.05; }
    sweep.rotation.z = t * 0.0012;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);
    blips.forEach((b, i) => b.scale.setScalar(0.7 + 0.6 * Math.abs(Math.sin(t * 0.003 + i))));
    globe.material.opacity = 0.34 + 0.1 * pulse;
    renderer.render(scene, camera);
  });
}

/* ================= growth chart ================= */
function growthChart(data) {
  if (!data.length) return '<p style="color:var(--muted)">No telemetry yet.</p>';
  const W = 460, H = 180, P = 28;
  const series = ['Tank', 'Missile', 'Aircraft'];
  const colors = { Tank: 'var(--tank)', Missile: 'var(--missile)', Aircraft: 'var(--aircraft)' };
  const all = data.flatMap(d => series.map(s => d[s] || 0));
  const max = Math.max(...all) * 1.15 || 1;
  const x = (i) => data.length === 1 ? W / 2 : P + (i / (data.length - 1)) * (W - P * 2);
  const y = (v) => H - P - (v / max) * (H - P * 2);
  let out = '';
  // grid
  for (let g = 0; g <= 3; g++) {
    const gy = P + (g / 3) * (H - P * 2);
    out += `<line x1="${P}" y1="${gy}" x2="${W - P}" y2="${gy}" stroke="var(--line)" stroke-dasharray="3 5"/>`;
  }
  for (const s of series) {
    const d = data.map((row, i) => `${i ? 'L' : 'M'}${x(i)},${y(row[s] || 0)}`).join(' ');
    out += `<path d="${d}" fill="none" stroke="${colors[s]}" stroke-width="2.5" stroke-linecap="round"/>`;
    data.forEach((row, i) => {
      out += `<circle cx="${x(i)}" cy="${y(row[s] || 0)}" r="4" fill="${colors[s]}" stroke="#0b1210" stroke-width="2"/>`;
    });
  }
  data.forEach((row, i) => {
    out += `<text x="${x(i)}" y="${H - 6}" fill="var(--muted)" font-size="12" text-anchor="middle" font-family="Rajdhani">${row.snapshot_date.slice(5)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${out}</svg>
    <div class="chart-legend">${series.map(s => `<span><i style="background:${colors[s]}"></i>${s}</span>`).join('')}</div>`;
}

/* ================= render ================= */
async function boot() {
  const app = document.getElementById('app');
  const gate = document.getElementById('gate');

  // auth check
  let user = null;
  if (localStorage.getItem('token')) {
    try { user = await api('/auth/me'); } catch { localStorage.clear(); }
  }
  if (!user) {
    gate.classList.remove('hidden');
    document.getElementById('gate-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('gate-name').value.trim();
      if (!name) return;
      try {
        const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: name }) });
        localStorage.setItem('token', res.token);
        location.reload();
      } catch (err) {
        document.getElementById('gate-err').textContent = err.message.toUpperCase();
      }
    });
    return;
  }

  const [alliance, growth, squads] = await Promise.all([
    api('/alliance'), api('/alliance/growth'), api('/squads').catch(() => []),
  ]);

  document.getElementById('hud-user').textContent = `${user.role?.toUpperCase() ?? ''} · ${user.username}`;

  /* hero */
  initHolo(document.getElementById('holo'));
  countUp(document.querySelector('.hero-readout .value'), alliance.aSquadPower);
  document.getElementById('hero-meta').innerHTML =
    `TOTAL <b>${fmtM(alliance.totalPower)}</b> · OPERATIVES <b>${alliance.memberCount}</b>`;

  /* divisions */
  const div = document.getElementById('divisions');
  for (const [type, top] of Object.entries(alliance.topPerType)) {
    const cls = CLS[type];
    div.appendChild(el(`
      <div class="division t-${cls}" style="color:var(--${cls})">
        ${ICON[cls]}
        <div class="dname">${type}</div>
        <div class="dtop">${esc(top.username)}</div>
        <div class="dpow">${fmtM(top.total_power)}</div>
        <div class="dcount">×${alliance.typeDistribution[type] ?? 0}</div>
      </div>`));
  }

  /* growth chart */
  document.getElementById('chart').innerHTML = growthChart(growth);

  /* roster */
  document.getElementById('roster-count').textContent = `${alliance.memberCount} DEPLOYED`;
  const roster = document.getElementById('roster');
  const maxPow = Math.max(...alliance.members.map(m => m.total_power), 1);
  const today = new Date().toISOString().slice(0, 10);
  alliance.members.forEach((m, i) => {
    const onLeave = m.vac_start && m.vac_end && m.vac_start <= today && today <= m.vac_end;
    const cls = CLS[m.primary_type] || '';
    roster.appendChild(el(`
      <div class="op ${onLeave ? 'on-leave' : ''}" style="animation-delay:${i * 70}ms">
        <div class="op-rank">${rankInsignia(m.role)}</div>
        <div>
          <div class="op-name">${esc(m.username)}<span class="role">${m.role?.toUpperCase()}</span></div>
          <div class="op-sub">
            ${cls ? `<span class="cls t-${cls}">${m.primary_type}</span>` : '<span>UNASSIGNED</span>'}
            <span>${(m.play_level || '').replace('semi-competitive', 'SEMI-COMP').toUpperCase()}</span>
          </div>
        </div>
        <div class="op-pow">
          <div class="p">${fmtM(m.total_power)}</div>
          <div class="a">A-SQD ${fmtM(m.a_squad_power)}</div>
        </div>
        ${onLeave ? '<div class="leave-stamp">ON LEAVE</div>' : ''}
        <div class="powbar"><i style="width:${(m.total_power / maxPow) * 100}%;animation-delay:${i * 70 + 200}ms"></i></div>
      </div>`));
  });

  /* loadout */
  const sq = document.getElementById('squads');
  for (const label of ['A', 'B', 'C', 'D']) {
    const s = squads.find(q => q.label === label);
    sq.appendChild(el(`
      <div class="squad ${s?.is_active ? '' : 'inactive'}">
        <div class="sl">${label}</div>
        <div class="st">${s?.unit_type ?? '—'}</div>
        <div class="sp">${s ? fmtM(s.total_power) : '·'}</div>
      </div>`));
  }

  /* supply draw */
  const drawBtn = document.getElementById('draw-btn');
  const drawOut = document.getElementById('draw-result');
  drawBtn.addEventListener('click', async () => {
    const mod = drawBtn.closest('.module');
    mod.classList.add('spin');
    const names = alliance.members.filter(m => m.total_power > 0).map(m => m.username);
    let n = 0;
    const shuffle = setInterval(() => {
      drawOut.innerHTML = `<b>${esc(names[n++ % names.length])}</b>`;
    }, 90);
    try {
      const res = await api('/draw/spin', { method: 'POST', body: JSON.stringify({ squad: 'A', min: 0, max: 9999 }) });
      setTimeout(() => {
        clearInterval(shuffle);
        mod.classList.remove('spin');
        drawOut.innerHTML = `WINNER<b>${esc(res.winner?.username ?? "—")}</b>`;
        if (navigator.vibrate) navigator.vibrate([40, 60, 120]);
      }, 1600);
    } catch (e) {
      clearInterval(shuffle);
      mod.classList.remove('spin');
      drawOut.innerHTML = `<b style="color:var(--alert)">OFFLINE</b>`;
    }
  });

  app.classList.remove('hidden');
}

boot();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
