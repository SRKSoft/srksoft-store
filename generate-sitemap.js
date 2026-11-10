// Auto-generates public/sitemap.xml from src/data/apps.json
// Runs automatically before every build (see package.json "build" script),
// so you NEVER edit the sitemap by hand — just add apps to apps.json as usual.

import { writeFileSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// No trailing slash here: every path below starts with "/".
const SITE_URL = 'https://apps.srksoft.online'

const today = new Date().toISOString().slice(0, 10)
const apps = JSON.parse(readFileSync(resolve(__dirname, 'src/data/apps.json'), 'utf-8'))

// Only accept real YYYY-MM-DD dates, otherwise fall back to today.
const toDate = (value) => (/^\d{4}-\d{2}-\d{2}/.test(String(value || '')) ? String(value).slice(0, 10) : today)

const escapeXml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const pages = [
  { path: '/', lastmod: today, changefreq: 'daily', priority: '1.0' },
  { path: '/about', lastmod: today, changefreq: 'monthly', priority: '0.5' },
]

// Two apps with the same id would produce the same URL twice, so skip repeats and warn.
const seenIds = new Set()
for (const app of apps) {
  if (!app.id) continue
  if (seenIds.has(app.id)) {
    console.warn(`⚠ duplicate app id skipped in sitemap: ${app.id} (${app.platform})`)
    continue
  }
  seenIds.add(app.id)
  pages.push({
    path: `/app/${encodeURIComponent(app.id)}`,
    lastmod: toDate(app.releaseDate),
    changefreq: 'weekly',
    priority: '0.8',
  })
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(SITE_URL + page.path)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

writeFileSync(resolve(__dirname, 'public/sitemap.xml'), xml)
console.log(`sitemap.xml generated with ${pages.length} URLs`)