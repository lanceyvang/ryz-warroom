// Demo snapshot used when no /api backend exists (e.g. GitHub Pages static hosting).
// Mirrors the fixtures in server.mjs.
export const MEMBERS = [
  { id: 2, username: 'Captain', role: 'r4', primary_type: 'Aircraft', play_level: 'semi-competitive', vac_start: null, vac_end: null, total_power: 201.5, a_squad_power: 95 },
  { id: 5, username: 'Soldier3', role: 'r1', primary_type: 'Missile', play_level: 'casual', vac_start: null, vac_end: null, total_power: 139.9, a_squad_power: 63.6 },
  { id: 6, username: 'Sup3rS0nicX', role: 'r5', primary_type: 'Tank', play_level: 'casual', vac_start: '2026-07-04', vac_end: '2026-07-06', total_power: 151.8, a_squad_power: 56.5 },
  { id: 4, username: 'Soldier2', role: 'r2', primary_type: 'Aircraft', play_level: 'semi-competitive', vac_start: null, vac_end: null, total_power: 123.9, a_squad_power: 56.3 },
  { id: 3, username: 'Soldier1', role: 'r3', primary_type: 'Aircraft', play_level: 'casual', vac_start: null, vac_end: null, total_power: 79.4, a_squad_power: 36.1 },
  { id: 8, username: 'Loki Thor', role: 'r3', primary_type: null, play_level: 'casual', vac_start: null, vac_end: null, total_power: 0, a_squad_power: 0 },
];

export const USER = { id: 6, username: 'Sup3rS0nicX', role: 'r5', primary_type: 'Tank', play_level: 'casual' };

export const ALLIANCE = {
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

export const GROWTH = [
  { snapshot_date: '2026-06-27', Tank: 210.4, Missile: 231.9, Aircraft: 461.2, total_power: 2210.3 },
  { snapshot_date: '2026-07-04', Tank: 240.2, Missile: 249.3, Aircraft: 498.7, total_power: 2408.9 },
];

export const SQUADS = [
  { id: 1, user_id: 6, label: 'A', unit_type: 'Tank', total_power: 56.5, is_active: 1 },
  { id: 2, user_id: 6, label: 'B', unit_type: 'Missile', total_power: 48.2, is_active: 1 },
  { id: 3, user_id: 6, label: 'C', unit_type: 'Aircraft', total_power: 30.1, is_active: 1 },
  { id: 4, user_id: 6, label: 'D', unit_type: 'Tank', total_power: 17, is_active: 0 },
];
