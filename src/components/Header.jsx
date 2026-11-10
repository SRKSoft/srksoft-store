import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import apps from '../data/apps.json'
import ThemeToggle from './ThemeToggle.jsx'
import InstallPWAButton from './InstallPWAButton.jsx'

const Icon = ({ name, size = 20 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    back: <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
    more: <><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    sparkle: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function Header() {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)

  const suggestions = query.trim()
    ? apps.filter(app => [app.title, app.category, ...(app.tags || [])].join(' ').toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : []

  useEffect(() => {
    const close = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname, location.search])

  const submit = e => {
    e.preventDefault()
    setShowSuggestions(false)
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/')
  }

  return (
    <header className="site-header">
      <div className="header-progress" />
      <div className="container site-header__inner">
        <div className="header-left">
          {location.pathname !== '/' && (
            <button className="icon-button header-back" onClick={() => navigate(-1)} aria-label="Go back"><Icon name="back" size={19} /></button>
          )}
          <Link to="/" className="brand" aria-label="SRK Soft Store home">
            <span className="brand__mark"><img src="/icons/android-chrome-512x512.png" alt="SRK Soft Logo" /></span>
            <span className="brand__copy"><strong>SRK Soft</strong><span>Store</span></span>
          </Link>
        </div>

        <div className={`search-box ${showSuggestions ? 'is-open' : ''}`} ref={searchRef}>
          <form onSubmit={submit} role="search">
            <span className="search-box__icon"><Icon name="search" size={19} /></span>
            <input value={query} onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }} onFocus={() => setShowSuggestions(true)} placeholder="Search store apps..." aria-label="Search store apps" />
            {query && <button type="button" className="search-box__clear" onClick={() => { setQuery(''); setShowSuggestions(false) }} aria-label="Clear search"><Icon name="close" size={16} /></button>}
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-panel">
              <div className="search-panel__label"><span>Suggestions</span><span>Enter to search</span></div>
              {suggestions.map(app => (
                <button key={app.id} className="search-result" onClick={() => { setQuery(''); setShowSuggestions(false); navigate(`/app/${app.id}`) }}>
                  <img src={app.icon} alt="" />
                  <span className="search-result__copy"><strong>{app.title}</strong><small>{app.category} · {app.platform}</small></span>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="header-actions">
          <Link to="/about" className="header-link">Developer</Link>
          <ThemeToggle />
          <span className="desktop-install"><InstallPWAButton /></span>
          <button className={`icon-button menu-trigger ${menuOpen ? 'is-active' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Open menu" aria-expanded={menuOpen}><Icon name="more" /></button>
        </nav>

        {menuOpen && (
          <div className="quick-menu">
            <div className="quick-menu__top"><span></span>𝐒𝐑𝐊 𝐒𝐨𝐟𝐭 𝐒𝐭𝐨𝐫𝐞<button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><Icon name="close" size={17} /></button></div>
            <Link to="/" className="quick-menu__item"><span>Store</span><small>Browse all apps</small></Link>
            <Link to="/about" className="quick-menu__item"><span>Developer</span><small>About the creator</small></Link>
            <div className="quick-menu__theme"><span>Appearance</span><ThemeToggle /></div>
            <div className="quick-menu__install"><InstallPWAButton /></div>
          </div>
        )}
      </div>
    </header>
  )
}