/**
 * Full verification harness for Saki Operations (current screens only).
 * Run: NODE_PATH=/tmp/node_modules node scripts/verify-current-app.cjs
 */
const puppeteer = require('puppeteer-core');

const WEB = process.env.WEB_URL || 'http://localhost:5173';
// Prefer VERIFY_API_URL — ambient API_URL may be origin-only (no /api/v1 prefix).
const API = (process.env.VERIFY_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const issues = [];
const warnings = [];
const passed = [];

function pass(name, detail = '') {
  passed.push({ name, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail) {
  issues.push({ name, detail });
  console.log(`FAIL  ${name} — ${detail}`);
}
function warn(name, detail) {
  warnings.push({ name, detail });
  console.log(`WARN  ${name} — ${detail}`);
}

async function collectPageErrors(page, bucket) {
  page.on('pageerror', (err) => bucket.push({ type: 'pageerror', text: err.message }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') bucket.push({ type: 'console.error', text: msg.text() });
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('vite') || url.includes('favicon') || url.includes('sockjs')) return;
    bucket.push({ type: 'requestfailed', text: `${url} :: ${req.failure()?.errorText || ''}` });
  });
}

function filterNoise(logs) {
  return logs.filter((l) => {
    const t = l.text || '';
    if (t.includes('Download the React DevTools')) return false;
    if (t.includes('apple-mobile-web-app-capable')) return false;
    if (t.includes('beforeinstallpromptevent')) return false;
    if (t.includes('Banner not shown')) return false;
    if (t.includes('Failed to load resource') && t.includes('favicon')) return false;
    return true;
  });
}

async function waitText(page, text, ms = 15000) {
  await page.waitForFunction(
    (needle) => (document.body?.innerText || '').includes(needle),
    { timeout: ms },
    text,
  );
}

async function setViewport(page, kind) {
  const map = {
    phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    tablet: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    desktop: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  };
  await page.setViewport(map[kind]);
}

async function hasOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      x: doc.scrollWidth > doc.clientWidth + 1,
      y: doc.scrollHeight > doc.clientHeight + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
}

async function gotoFresh(page, path = '/') {
  await page.goto(`${WEB}${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
}

async function clearStorage(page) {
  await page.goto(WEB, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function main() {
  try {
    const res = await fetch(`${API}/health`);
    const json = await res.json();
    if (res.ok && json.status === 'ok') pass('API health', json.service || 'ok');
    else fail('API health', `status ${res.status} body=${JSON.stringify(json)}`);
  } catch (e) {
    fail('API health', String(e.message || e));
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  const logs = [];
  await collectPageErrors(page, logs);

  // --- Splash ---
  await clearStorage(page);
  await setViewport(page, 'desktop');
  logs.length = 0;
  await gotoFresh(page, '/');
  await new Promise((r) => setTimeout(r, 800));
  const splashText = await page.evaluate(() => document.body.innerText);
  if (splashText.includes('Saki Operations') || splashText.includes('Powered by')) {
    pass('Splash Screen', 'brand/content visible');
  } else if ((await page.evaluate(() => document.getElementById('root')?.childElementCount)) > 0) {
    pass('Splash Screen', 'root has content (may have already navigated)');
  } else {
    fail('Splash Screen', 'blank or missing content');
  }

  await new Promise((r) => setTimeout(r, 2800));
  let url = page.url();
  if (url.includes('/language') || (await page.evaluate(() => document.body.innerText)).includes('Choose your language')) {
    pass('Splash navigates to Language', url);
  } else if (url.includes('/login')) {
    pass('Splash navigates to Login (language already set)', url);
  } else {
    warn('Splash navigation', `unexpected url ${url}`);
  }

  // --- Language Selection ---
  await clearStorage(page);
  await gotoFresh(page, '/language');
  await waitText(page, 'Choose your language');
  pass('Language Selection screen');
  await page.evaluate(() => {
    const en = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent || '').includes('English'),
    );
    en?.click();
  });
  await page.waitForFunction(() => location.pathname.includes('/login'), { timeout: 10000 });
  await waitText(page, 'Welcome back');
  pass('Language selection navigates to Login');

  // --- Login ---
  pass('Login screen');
  const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (dark) pass('Dark theme on Login');
  else fail('Dark theme on Login', 'html missing .dark');

  await page.click('a[href="/forgot-password"]');
  await page.waitForFunction(() => location.pathname.includes('forgot'), { timeout: 8000 });
  await waitText(page, 'Forgot password');
  pass('Forgot password screen');
  await gotoFresh(page, '/login');
  // Full navigation remounts bootstrap — wait for splash + login.
  await waitText(page, 'Welcome back', 20000);

  await page.click('#identifier', { clickCount: 3 });
  await page.type('#identifier', 'EMP-ADM-001');
  await page.click('#password', { clickCount: 3 });
  await page.type('#password', 'SakiOps@2026Secure');
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent || '').toLowerCase().includes('sign in'),
    );
    btn?.click();
  });
  await page.waitForFunction(
    () => location.pathname.includes('/home') || (document.body?.innerText || '').includes('Quick actions'),
    { timeout: 15000 },
  );
  const afterLoginUrl = page.url();
  const afterLoginText = await page.evaluate(() => document.body.innerText);
  let authenticated = false;
  if (afterLoginUrl.includes('/home') || afterLoginText.includes('Quick actions')) {
    authenticated = true;
    pass('Authentication login → Home');
  } else {
    fail('Authentication login → Home', `url=${afterLoginUrl} text=${afterLoginText.slice(0, 200)}`);
  }

  if (authenticated) {
    if (afterLoginText.includes('Saki Tours') || afterLoginText.includes('HHCO')) {
      pass('Home Dashboard module cards');
    } else fail('Home Dashboard module cards', 'missing module text');

    for (const vp of ['phone', 'tablet', 'desktop']) {
      await setViewport(page, vp);
      await new Promise((r) => setTimeout(r, 400));
      const ov = await hasOverflow(page);
      if (ov.x) fail(`Home overflow ${vp}`, `scrollWidth=${ov.scrollWidth} clientWidth=${ov.clientWidth}`);
      else pass(`Home no horizontal overflow (${vp})`);
      const count = await page.evaluate(() => document.getElementById('root')?.childElementCount || 0);
      if (count === 0) fail(`Home blank ${vp}`, 'empty root');
      else pass(`Home renders (${vp})`);
    }
    await setViewport(page, 'desktop');

    await gotoFresh(page, '/notifications');
    await new Promise((r) => setTimeout(r, 800));
    if (page.url().includes('/notifications')) pass('Notifications placeholder');
    else fail('Notifications', page.url());

    await gotoFresh(page, '/profile');
    await new Promise((r) => setTimeout(r, 800));
    if (page.url().includes('/profile')) pass('Profile placeholder');
    else fail('Profile', page.url());

    await gotoFresh(page, '/settings');
    await new Promise((r) => setTimeout(r, 800));
    if (page.url().includes('/settings')) pass('Settings placeholder');
    else fail('Settings', page.url());

    const switched = await page.evaluate(async () => {
      const trigger = [...document.querySelectorAll('button,select')].find((el) =>
        /language|english|sinhala|භාෂා|සිංහල|EN|SI/i.test(
          el.textContent || el.getAttribute('aria-label') || '',
        ),
      );
      if (!trigger) return { ok: false, reason: 'selector not found' };
      trigger.click();
      await new Promise((r) => setTimeout(r, 400));
      const si = [...document.querySelectorAll('button,[role="option"],[role="menuitem"]')].find((el) =>
        /සිංහල|Sinhala/i.test(el.textContent || ''),
      );
      if (!si) return { ok: false, reason: 'sinhala option not found' };
      si.click();
      await new Promise((r) => setTimeout(r, 700));
      const text = document.body.innerText;
      return {
        ok: document.documentElement.lang === 'si' || /සැකසුම්|පැතිකඩ|දැනුම්දීම්/.test(text),
        lang: document.documentElement.lang,
      };
    });
    if (switched.ok) pass('Language switching', JSON.stringify(switched));
    else warn('Language switching', switched.reason || JSON.stringify(switched));

    await gotoFresh(page, '/home');
    await new Promise((r) => setTimeout(r, 1000));
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500));
    if (page.url().includes('/home')) pass('Session restore on refresh');
    else fail('Session restore on refresh', `landed on ${page.url()}`);

    await gotoFresh(page, '/settings');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    if (page.url().includes('/settings')) pass('Refresh deep link /settings', page.url());
    else fail('Refresh deep link /settings', page.url());

    await setViewport(page, 'phone');
    await gotoFresh(page, '/home');
    await new Promise((r) => setTimeout(r, 1000));
    const navClick = await page.evaluate(() => {
      const link = [...document.querySelectorAll('a,button')].find((el) =>
        /notifications|දැනුම්දීම්/i.test(el.textContent || el.getAttribute('aria-label') || ''),
      );
      if (!link) return false;
      link.click();
      return true;
    });
    await new Promise((r) => setTimeout(r, 800));
    if (navClick && page.url().includes('/notifications')) pass('Phone bottom/nav to Notifications');
    else warn('Phone navigation', `clicked=${navClick} url=${page.url()}`);
  }

  await clearStorage(page);
  await page.evaluate(() => {
    localStorage.setItem('saki-operations.language-selected', 'true');
    localStorage.setItem('saki-operations.locale', 'en');
  });
  await gotoFresh(page, '/login');
  await page.reload({ waitUntil: 'networkidle0' });
  await waitText(page, 'Welcome back', 15000);
  pass('Refresh Login still works');

  const blank = await page.evaluate(() => document.getElementById('root')?.childElementCount === 0);
  if (blank) fail('Blank root', 'childElementCount 0');
  else pass('Root not blank');

  const noiseFiltered = filterNoise(logs);
  const critical = noiseFiltered.filter((n) => n.text.includes('Maximum update depth') || n.type === 'pageerror');
  if (critical.length === 0) pass('No React page errors / update-depth loops');
  else {
    for (const n of critical) fail(`Runtime ${n.type}`, n.text.slice(0, 240));
  }
  for (const n of noiseFiltered.filter((x) => !critical.includes(x))) {
    warn(`Runtime ${n.type}`, n.text.slice(0, 240));
  }

  await browser.close();

  console.log('\n=== SUMMARY ===');
  console.log(
    JSON.stringify({ passed: passed.length, failed: issues.length, warnings: warnings.length, issues, warnings }, null, 2),
  );
  process.exit(issues.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
