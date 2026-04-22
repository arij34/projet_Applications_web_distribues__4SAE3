/**
 * Script de test des API Skill Management
 * Vérifie que le backend (proxy → localhost:8091) répond sur les endpoints utilisés par le front.
 *
 * Usage:
 *   node scripts/test-skill-management-api.js
 *   node scripts/test-skill-management-api.js --token "VOTRE_BEARER_TOKEN"   # pour tester les routes /user/me
 *
 * Prérequis: le backend (API Gateway / skill-management) doit tourner sur le port 8091.
 */

// Cible réelle : proxy enlève /api → 8091. Si 404, essayer avec base path (ex: API_BASE=http://localhost:8091/api)
const BASE = process.env.API_BASE || 'http://localhost:8091';
const token = process.argv.find(a => a.startsWith('--token='))?.split('=')[1] || process.env.BEARER_TOKEN;
const headers = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = `Bearer ${token}`;

const tests = [
  // FreelancerSkill
  { name: 'GET /freelancer-skill (liste)', method: 'GET', path: '/freelancer-skill' },
  { name: 'GET /freelancer-skill/user/me (utilisateur courant)', method: 'GET', path: '/freelancer-skill/user/me', auth: true },
  { name: 'GET /freelancer-skill/level/3', method: 'GET', path: '/freelancer-skill/level/3' },
  { name: 'POST /freelancer-skill/check-skills/me', method: 'POST', path: '/freelancer-skill/check-skills/me', body: ['Java'], auth: true },
  { name: 'POST /freelancer-skill/check-existing/me', method: 'POST', path: '/freelancer-skill/check-existing/me', body: ['Java'], auth: true },
  // Availability
  { name: 'GET /availability', method: 'GET', path: '/availability' },
  { name: 'GET /availability/user/me', method: 'GET', path: '/availability/user/me', auth: true },
  { name: 'POST /availability/preview', method: 'POST', path: '/availability/preview', body: { weeklyHours: 20 } },
  // Education
  { name: 'GET /education', method: 'GET', path: '/education' },
  { name: 'GET /education/user/me', method: 'GET', path: '/education/user/me', auth: true },
  { name: 'GET /education/user/me/latest', method: 'GET', path: '/education/user/me/latest', auth: true },
  // Experience
  { name: 'GET /experience', method: 'GET', path: '/experience' },
  { name: 'GET /experience/user/me/total-years', method: 'GET', path: '/experience/user/me/total-years', auth: true },
  // Notifications
  { name: 'GET /notifications/admin', method: 'GET', path: '/notifications/admin', auth: true },
  { name: 'GET /notifications/admin/unread-count', method: 'GET', path: '/notifications/admin/unread-count', auth: true },
  { name: 'GET /notifications/user/me', method: 'GET', path: '/notifications/user/me', auth: true },
  { name: 'GET /notifications/user/me/unread-count', method: 'GET', path: '/notifications/user/me/unread-count', auth: true },
];

async function runOne(test) {
  const url = BASE + test.path;
  const opt = { method: test.method, headers: { ...headers } };
  if (test.body) opt.body = JSON.stringify(test.body);
  if (test.auth && !token) {
    return { name: test.name, status: 'SKIP', endpointExists: null, message: 'Token requis (--token=xxx ou BEARER_TOKEN)' };
  }
  try {
    const res = await fetch(url, opt);
    const endpointExists = res.ok || res.status === 401 || res.status === 403 || res.status === 400;
    let body = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { body = await res.json(); } catch (_) {}
    } else if (res.status !== 204) {
      body = (await res.text()).slice(0, 200);
    }
    let message = body?.message || (typeof body === 'string' ? body : null) || res.statusText;
    if (res.status === 401) message = 'Non authentifié (normal sans token)';
    if (res.status === 403) message = 'Accès refusé';
    return {
      name: test.name,
      status: res.status,
      ok: res.ok,
      endpointExists,
      message,
    };
  } catch (err) {
    return { name: test.name, status: 'ERR', ok: false, endpointExists: false, message: err.message };
  }
}

async function main() {
  console.log('Base URL:', BASE);
  console.log('Token:', token ? 'Oui' : 'Non (routes /user/me et /admin seront SKIP ou 401)\n');

  const results = [];
  for (const t of tests) {
    const r = await runOne(t);
    results.push(r);
    const icon = r.ok ? '✓' : r.status === 'SKIP' ? '○' : r.endpointExists ? '◐' : '✗';
    const status = r.status === 'SKIP' ? 'SKIP' : (typeof r.status === 'number' ? r.status : r.status);
    const msg = r.message ? (typeof r.message === 'string' ? r.message.slice(0, 55) : '') : '';
    console.log(`${icon} ${r.name} → ${status} ${msg ? '- ' + msg : ''}`);
  }

  const ok = results.filter(r => r.ok).length;
  const skip = results.filter(r => r.status === 'SKIP').length;
  const exists = results.filter(r => r.endpointExists && !r.ok).length;
  const fail = results.filter(r => r.status !== 'SKIP' && !r.ok && !r.endpointExists).length;
  console.log('\n--- Résumé ---');
  console.log(`OK (200): ${ok} | Endpoint existe (401/403): ${exists} | 404/ERR: ${fail} | Ignorés (auth): ${skip}`);
  if (fail > 0) console.log('\nSi tous les appels sont en 404: vérifiez que le backend Skill Management tourne sur le port 8091 et expose ces chemins.');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
