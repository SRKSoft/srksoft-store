import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import apps from '../data/apps.json'
import developer from '../data/developer.json'
import AppCard from '../components/AppCard.jsx'
import useSEO from '../hooks/useSEO.js'

const SITE_URL = 'https://apps.srksoft.online'

// Maps the store's categories to schema.org application types that Google understands.
const SCHEMA_CATEGORY = {
  'Developer Tools': 'DeveloperApplication',
  Media: 'MultimediaApplication',
  Productivity: 'BusinessApplication',
  Utilities: 'UtilitiesApplication',
  Security: 'SecurityApplication',
  'AI Tools': 'UtilitiesApplication',
  Gaming: 'GameApplication',
  Emulators: 'GameApplication',
  'Disk Tools': 'UtilitiesApplication',
  Downloaders: 'UtilitiesApplication',
  Communication: 'CommunicationApplication',
  'Remote Access': 'UtilitiesApplication',
  Browsers: 'BrowserApplication',
  Customization: 'DesktopEnhancementApplication',
  Network: 'UtilitiesApplication',
}

const collapse = (text = '') => String(text).replace(/\s+/g, ' ').trim()

function truncate(text, max = 158) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

/** Builds title, description, canonical path and structured data for one app page. */
function buildSeo(app) {
  if (!app) return { title: 'App not found | SRK Soft Store', noindex: true }

  // Apps that come from GitHub have a repoUrl. Your own apps (e.g. Inventory POS) do not,
  // so they must never be described as "free" or "open source".
  const isOpenSource = Boolean(app.repoUrl)
  const platform = app.platform || 'Windows'
  const path = `/app/${encodeURIComponent(app.id)}`
  const url = `${SITE_URL}${path}`
  const summary = collapse(app.shortDescription || String(app.description || '').split('\n')[0])
  const ending = /[.!?]$/.test(summary) ? '' : '.'
  const tail = isOpenSource
    ? ` Free open source ${platform} download from the official release.`
    : ` Available for ${platform} from SRK Soft Store.`

  const software = {
    '@type': 'SoftwareApplication',
    '@id': `${url}#software`,
    name: app.title,
    url,
    description: summary,
    image: app.icon,
    applicationCategory: SCHEMA_CATEGORY[app.category] || 'UtilitiesApplication',
    operatingSystem: platform,
    softwareVersion: app.version,
    fileSize: app.size,
    downloadUrl: app.downloadUrl,
    dateModified: app.releaseDate,
    keywords: app.tags?.join(', '),
    ...(isOpenSource
      ? {
          isAccessibleForFree: true,
          sameAs: app.repoUrl,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }
      : {
          author: { '@type': 'Organization', name: 'SRK Soft', url: 'https://srksoft.online/' },
        }),
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Store', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: app.title, item: url },
    ],
  }

  return {
    title: isOpenSource
      ? `Download ${app.title} for ${platform} – Free & Open Source | SRK Soft Store`
      : `${app.title} for ${platform} | SRK Soft Store`,
    description: truncate(`${summary}${ending}${tail}`),
    keywords: app.tags?.join(', '),
    path,
    image: app.icon,
    jsonLd: { '@context': 'https://schema.org', '@graph': [software, breadcrumb] },
  }
}

function youtubeId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)
  return m?.[1] || null
}

const Icon = ({ name, size = 18 }) => {
  const p = {
    arrow:<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>, back:<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>, share:<><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></>, download:<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></>, shield:<><path d="M12 3 20 6v5c0 5-3.3 8.4-8 10-4.7-1.6-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>, external:<><path d="M14 5h5v5"/><path d="m19 5-8 8"/><path d="M19 13v5H6V5h5"/></>
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>
}

export default function AppDetail() {
  const { id } = useParams()
  const app = apps.find(a => a.id === id)
  const [copied, setCopied] = useState(false)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  useSEO(buildSeo(app))

  if (!app) return <main className="not-found"><div className="not-found__box"><span>404</span><h1>App not found</h1><p>This app may have been removed or the link is incorrect.</p><Link to="/" className="button button--primary">Back to store <Icon name="arrow" size={16}/></Link></div></main>

  const related = apps.filter(a => a.id !== app.id && (a.category === app.category || (a.tags || []).some(t => (app.tags || []).includes(t)))).slice(0, 4)
  const videoId = youtubeId(app.youtube)
  const media = [...(videoId ? [{ type:'video', id:videoId }] : []), ...(app.screenshots || []).map(src => ({ type:'image', src }))]
  const hasMedia = media.length > 0
  const descriptionParts = app.description.split('\n\n')

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: app.title, text: app.shortDescription, url: window.location.href })
      else { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800) }
    } catch {}
  }

  return <main className="detail-page">

    {/* Lightbox Modal Overlay */}
    {lightboxOpen && media[mediaIndex]?.type === 'image' && (
      <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
        <div className="lightbox-content" onClick={e => e.stopPropagation()}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
          <img src={media[mediaIndex].src} alt="Expanded preview" />
        </div>
      </div>
    )}

    <section className="detail-hero"><div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Store</Link><span>/</span><span>{app.category}</span><span>/</span><b>{app.title}</b></nav>
      <div className="product-hero">
        <div className="product-hero__visual"><div className="product-icon"><img src={app.icon} alt={`${app.title} icon`} /></div><div className="product-icon__ring" /></div>
        <div className="product-hero__copy">
          <div className="product-category">{app.category} · {app.platform}</div>
          <h1>{app.title}</h1>
          <p>{app.shortDescription}</p>
          <Link to="/about" className="developer-line"><img src={developer.photo} alt="" /> By {developer.name}</Link>
          <div className="product-stats">{app.rating ? <><span><b>★</b> {app.rating.toFixed(1)}</span><i /> </> : null}<span>{app.size}</span><i /> <span>Version {app.version}</span><i /> <span>Updated {app.releaseDate}</span></div>
          <div className="product-actions"><a href={app.downloadUrl} rel="noopener noreferrer" className="button button--primary button--large"><Icon name="download" size={18}/> Install {app.title}</a><button className="button button--soft" onClick={share}><Icon name="share" size={18}/> {copied ? 'Link copied' : 'Share'}</button></div>
          <div className="trust-line"><Icon name="shield" size={16}/><span>Download opens the developer's existing release link.</span></div>
        </div>
      </div>
    </div></section>

    <section className="container detail-layout">
      <div className="detail-main">
        {hasMedia && <section className="media-section"><div className="section-heading"><div><span className="section-kicker">Preview</span><h2>See it in action</h2></div><span className="media-counter">{mediaIndex + 1} / {media.length}</span></div>
          <div className="media-stage">
            {media[mediaIndex]?.type === 'video' ? <div className="video-frame"><iframe src={`https://www.youtube.com/embed/${media[mediaIndex].id}?rel=0&modestbranding=1&playsinline=1&controls=1`} title={`${app.title} preview`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <img src={media[mediaIndex]?.src} alt={`${app.title} screenshot ${mediaIndex + 1}`} onClick={() => setLightboxOpen(true)} style={{ cursor: 'pointer' }} title="Click to view full size" />}
            {media.length > 1 && <><button className="media-nav media-nav--prev" onClick={() => setMediaIndex(i => (i - 1 + media.length) % media.length)} aria-label="Previous preview">‹</button><button className="media-nav media-nav--next" onClick={() => setMediaIndex(i => (i + 1) % media.length)} aria-label="Next preview">›</button></>}
          </div>
          {media.length > 1 && <div className="media-thumbs">{media.map((item,i) => <button key={i} className={i === mediaIndex ? 'is-active' : ''} onClick={() => setMediaIndex(i)}>{item.type === 'video' ? <span className="thumb-play">▶</span> : <img src={item.src} alt="" />}</button>)}</div>}
        </section>}

        <section className="content-section"><div className="section-heading"><div><span className="section-kicker">Overview</span><h2>About this app</h2></div></div><div className="description">{descriptionParts.map((part,i) => <p key={i}>{part}</p>)}</div></section>

        <section className="content-section"><div className="section-heading"><div><span className="section-kicker">Specifications</span><h2>Good to know</h2></div></div><div className="spec-grid"><div><span>Version</span><b>{app.version}</b></div><div><span>Platform</span><b>{app.platform}</b></div><div><span>Download size</span><b>{app.size}</b></div><div><span>Category</span><b>{app.category}</b></div></div></section>

        {app.tags?.length > 0 && <section className="content-section"><div className="tag-list">{app.tags.map(tag => <span key={tag}>#{tag}</span>)}</div></section>}
      </div>

      <aside className="detail-sidebar">
        <div className="side-card"><span className="side-card__kicker">Installation</span><h3>Ready to try it?</h3><p>Use the official download link already configured for this app.</p><a href={app.downloadUrl} rel="noopener noreferrer" className="button button--primary">Install now <Icon name="arrow" size={16}/></a>{app.repoUrl && <a href={app.repoUrl} target="_blank" rel="noreferrer" className="side-link">View source / release <Icon name="external" size={15}/></a>}</div>
        {related.length > 0 && <div className="related"><div className="related__heading"><span>More to explore</span><Link to="/">See all <Icon name="arrow" size={14}/></Link></div>{related.map((item,i) => <AppCard key={item.id} app={item} index={i} compact />)}</div>}
      </aside>
    </section>
  </main>
}