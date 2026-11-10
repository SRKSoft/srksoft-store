// update-apps.cjs  —  GitHub Releases se apps.json banata hai
// Chalane ka tareeqa (PowerShell):
//   $env:GITHUB_TOKEN="your_token"
//   node update-apps.cjs           (output: src/data/apps.json)
// Node 18+ chahiye (built-in fetch). Koi npm package nahi chahiye.

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_TOKEN;
const MANUAL_FILE = path.join(__dirname, 'manual-apps.json'); // wo apps jo GitHub par nahi hain
const SEED_FILE = path.join(__dirname, 'apps-seed.json');
const OVERRIDES_FILE = path.join(__dirname, 'overrides.json'); // youtube/screenshots haath se
const OUT = process.argv[2] || path.join(__dirname, 'src', 'data', 'apps.json');

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'mystore-updater',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(url, extra = {}) {
  const r = await fetch(url, { headers: { ...headers, ...extra } });
  if (!r.ok) {
    if (r.status === 403 || r.status === 429) {
      if (r.headers.get('x-ratelimit-remaining') === '0') throw new Error('RATE_LIMIT');
    }
    throw new Error(`HTTP ${r.status}`);
  }
  return r;
}

// ---------- asset chunne ke rules ----------
const RULES = {
  Windows: {
    ext: [/\.msi$/i, /\.exe$/i, /\.zip$/i, /\.7z$/i],
    bad: /(arm64|aarch64|[-_.]arm|linux|mac|darwin|osx|android|ia32|i686|x86(?![_-]?64)|symbols|source|debug|\.sig|\.sha|\.asc|\.blockmap)/i,
    good: /(x64|x86_64|amd64|win64|windows|win)/i,
    prefer: /(setup|install)/i,
  },
  Android: {
    ext: [/\.apk$/i],
    bad: /(x86|mips|debug)/i,
    good: /(universal|arm64|release)/i,
    prefer: /$^/,
  },
  Linux: {
    ext: [/\.appimage$/i, /\.deb$/i, /\.tar\.gz$/i],
    bad: /(arm|aarch|win|mac|darwin|source|\.sig|\.sha|\.asc)/i,
    good: /(x86_64|amd64|x64|linux)/i,
    prefer: /$^/,
  },
  macOS: {
    ext: [/\.dmg$/i, /\.pkg$/i, /\.zip$/i],
    bad: /(win|linux|\.sig|\.sha|\.asc)/i,
    good: /(universal|arm64|macos|mac|darwin)/i,
    prefer: /$^/,
  },
};

function pickAsset(assets, platform) {
  const rule = RULES[platform];
  if (!rule) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const a of assets) {
    const extIdx = rule.ext.findIndex((re) => re.test(a.name));
    if (extIdx === -1) continue;
    let s = 100 - extIdx * 10;
    if (rule.good.test(a.name)) s += 20;
    if (rule.prefer.test(a.name)) s += 15;
    if (/portable/i.test(a.name)) s -= 10;
    if (rule.bad.test(a.name)) s -= 50;
    if (s > bestScore) { bestScore = s; best = a; }
  }
  return best;
}

function fmtSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(mb >= 100 ? 0 : 1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// ---------- README se screenshots ----------
const JUNK = /(shields\.io|badge|\.svg(\?|$)|travis|codecov|buymeacoffee|star-history|github\.com\/[^/]+\/[^/]+\/actions|sponsor|patreon|ko-fi|crowdin|weblate|opencollective|logo|icon)/i;
async function readmeImages(repo, branch) {
  try {
    const r = await gh(`https://api.github.com/repos/${repo}/readme`, { Accept: 'application/vnd.github.raw+json' });
    const text = await r.text();
    const urls = [];
    for (const m of text.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) urls.push(m[1]);
    for (const m of text.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) urls.push(m[1]);
    const out = [];
    for (let u of urls) {
      if (JUNK.test(u)) continue;
      if (!/^https?:/i.test(u)) u = `https://raw.githubusercontent.com/${repo}/${branch}/${u.replace(/^\.?\//, '')}`;
      if (!/\.(png|jpe?g|gif|webp)(\?|$)/i.test(u) && !/githubusercontent|user-attachments/i.test(u)) continue;
      if (!out.includes(u)) out.push(u);
      if (out.length >= 6) break;
    }
    return out;
  } catch { return []; }
}

// ---------- seed row theek karna ----------
// Har row aisi honi chahiye: [repo, title, category, short description, (optional id)]
// Agar title likhna bhool jao (sirf 3 cheezein), to title galat jagah chala jata tha
// (app ka naam "Utilities" ban jata tha). Ab repo ka naam title bana kar warning deta hai.
function normalizeRow(item) {
  if (item.length >= 4) return item;
  if (item.length === 3) {
    const [repo, category, short] = item;
    const title = repo.split('/')[1];
    console.warn(`\n⚠️  seed row "${repo}" mein title nahi hai — "${title}" use kiya. apps-seed.json mein theek kar do.`);
    return [repo, title, category, short];
  }
  throw new Error('seed row mein [repo, title, category, short] hona chahiye');
}

// ---------- ek app ----------
async function buildApp(group, item, overrides) {
  const [repo, title, category, short, idOverride] = item;
  const [owner, name] = repo.split('/');
  const platform = group.platform;

  const info = await (await gh(`https://api.github.com/repos/${repo}`)).json();
  const releases = await (await gh(`https://api.github.com/repos/${repo}/releases?per_page=20`)).json();

  const usable = releases.filter((r) => !r.draft);
  const ordered = [...usable.filter((r) => !r.prerelease), ...usable.filter((r) => r.prerelease)];
  let rel = null, asset = null;
  for (const r of ordered) {
    const a = pickAsset(r.assets || [], platform);
    if (a) { rel = r; asset = a; break; }
  }
  if (!asset) throw new Error(`koi ${platform} asset nahi mila (sirf source code ho sakta hai)`);

  let shots = await readmeImages(repo, info.default_branch);
  if (shots.length === 0) shots = [`https://opengraph.githubassets.com/1/${repo}`];

  const id = idOverride || name.toLowerCase();
  const entry = {
    id,
    title,
    shortDescription: short,
    description:
      `${short}\n\n` +
      (info.description ? `${info.description}\n\n` : '') +
      `Free and open source. Download the latest official release directly from GitHub.`,
    icon: `https://github.com/${owner}.png?size=200`,
    screenshots: shots,
    youtube: '',
    category,
    tags: [...new Set([platform.toLowerCase(), category.toLowerCase().replace(/\s+/g, '-'), name.toLowerCase(), 'open-source'])],
    version: String(rel.tag_name).replace(/^v/i, ''),
    size: fmtSize(asset.size),
    platform,
    stars: info.stargazers_count,
    rating: null,
    downloadUrl: asset.browser_download_url,
    repoUrl: info.html_url,
    releaseDate: (rel.published_at || '').slice(0, 10),
  };
  return { ...entry, ...(overrides[id] || {}) };
}

// ---------- main ----------
(async () => {
  if (!TOKEN) console.warn('⚠️  GITHUB_TOKEN set nahi — sirf 60 requests/ghanta milengi, 20-25 apps ke baad ruk jayega.\n');
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  const overrides = fs.existsSync(OVERRIDES_FILE) ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8')) : {};

  if (fs.existsSync(OUT)) fs.copyFileSync(OUT, OUT.replace(/\.json$/, '.backup.json'));
  const kept = fs.existsSync(MANUAL_FILE) ? JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf8')) : [];
  console.log(`Manual apps: ${kept.length}`);

  const results = [...kept];
  const seen = new Set(kept.map((e) => e.id));
  const failed = [];
  let n = 0;
  const total = seed.reduce((s, g) => s + g.apps.length, 0);

  for (const group of seed) {
    for (const rawItem of group.apps) {
      n++;
      process.stdout.write(`[${n}/${total}] ${rawItem[0]} ... `);
      try {
        const item = normalizeRow(rawItem);
        const app = await buildApp(group, item, overrides);
        // Id pehle se maujood ho to pehle owner ka naam, phir bhi takra jaye to platform ka naam lagao.
        if (seen.has(app.id)) app.id = `${item[0].split('/')[0].toLowerCase()}-${app.id}`;
        if (seen.has(app.id)) app.id = `${app.id}-${group.platform.toLowerCase()}`;
        seen.add(app.id);
        results.push(app);
        console.log(`OK  ${app.version}  ${app.size}`);
      } catch (e) {
        if (e.message === 'RATE_LIMIT') { console.log('RATE LIMIT — ruk gaya'); failed.push(`${rawItem[0]}: rate limit`); break; }
        console.log(`FAIL (${e.message})`);
        failed.push(`${rawItem[0]}: ${e.message}`);
      }
      await sleep(250);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'failed.txt'), failed.join('\n'), 'utf8');
  console.log(`\nTayyar: ${results.length} apps -> ${OUT}`);
  if (failed.length) console.log(`Nakam ${failed.length} (tafseel failed.txt mein)`);
})();