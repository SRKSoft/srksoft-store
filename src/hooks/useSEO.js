import { useEffect } from 'react'

export const SITE_URL = 'https://apps.srksoft.online'
const SITE_NAME = 'SRK Soft Store'
const DEFAULT_TITLE = `${SITE_NAME} – Free Open Source Apps & Tools`
const DEFAULT_DESCRIPTION =
  'Download free open source apps, tools and games for Windows, macOS, Linux and Android. Direct downloads from official GitHub releases, no account needed.'
const DEFAULT_IMAGE = `${SITE_URL}/icons/android-chrome-512x512.png`
const JSON_LD_ID = 'seo-json-ld'

/** Create-or-update (or remove, when value is empty) a tag inside <head>. */
function syncTag(tag, attr, key, valueAttr, value) {
  const selector = `${tag}[${attr}="${key}"]`
  let el = document.head.querySelector(selector)
  if (!value) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement(tag)
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute(valueAttr, value)
}

const setName = (name, value) => syncTag('meta', 'name', name, 'content', value)
const setProperty = (property, value) => syncTag('meta', 'property', property, 'content', value)

function toAbsoluteUrl(url) {
  try {
    return new URL(url, SITE_URL).href
  } catch {
    return DEFAULT_IMAGE
  }
}

function toCanonical(path) {
  const clean = path === '/' ? '/' : path.replace(/\/+$/, '')
  return `${SITE_URL}${clean || '/'}`
}

/**
 * Sets everything search engines and social crawlers read from <head>
 * for the current page: title, description, canonical URL, robots,
 * Open Graph, Twitter Card and optional JSON-LD structured data.
 *
 * Every route should call this once, so no page ever shows stale tags.
 *
 * @param {object}  options
 * @param {string}  [options.title]        Page <title>
 * @param {string}  [options.description]  Meta description (about 120–160 characters)
 * @param {string}  [options.keywords]     Comma separated (ignored by Google, harmless)
 * @param {string}  [options.path]         Route path used for canonical/og:url, e.g. "/app/mgba"
 * @param {string}  [options.image]        Preview image URL (relative or absolute)
 * @param {boolean} [options.noindex]      Keep this page out of search results
 * @param {object}  [options.jsonLd]       JSON-LD object (use "@graph" for several entities)
 */
export default function useSEO({ title, description, keywords, path, image, noindex = false, jsonLd } = {}) {
  // A string is a stable dependency; a fresh object on every render is not.
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const pageTitle = title || DEFAULT_TITLE
    const pageDescription = description || DEFAULT_DESCRIPTION
    const pageUrl = toCanonical(path ?? window.location.pathname)
    const pageImage = toAbsoluteUrl(image || DEFAULT_IMAGE)

    document.title = pageTitle
    setName('description', pageDescription)
    setName('keywords', keywords)
    setName('robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large')

    // A canonical tag on a noindex page sends mixed signals, so drop it there.
    syncTag('link', 'rel', 'canonical', 'href', noindex ? '' : pageUrl)

    setProperty('og:site_name', SITE_NAME)
    setProperty('og:type', 'website')
    setProperty('og:title', pageTitle)
    setProperty('og:description', pageDescription)
    setProperty('og:url', pageUrl)
    setProperty('og:image', pageImage)

    setName('twitter:card', 'summary')
    setName('twitter:title', pageTitle)
    setName('twitter:description', pageDescription)
    setName('twitter:image', pageImage)

    let script = document.getElementById(JSON_LD_ID)
    if (jsonLdText) {
      if (!script) {
        script = document.createElement('script')
        script.id = JSON_LD_ID
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = jsonLdText
    } else {
      script?.remove()
    }

    return () => document.getElementById(JSON_LD_ID)?.remove()
  }, [title, description, keywords, path, image, noindex, jsonLdText])
}