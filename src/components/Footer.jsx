import { Link } from 'react-router-dom'
import developer from '../data/developer.json'

export default function Footer() {
  const links = Object.entries(developer.socials || {}).filter(([,url]) => url)
  return <footer className="site-footer">
    <div className="container site-footer__top">
      <div className="footer-brand"><span className="footer-mark"><img src="/icons/android-chrome-512x512.png" alt="" /></span><div><strong>𝐒𝐑𝐊 𝐒𝐨𝐟𝐭 𝐒𝐭𝐨𝐫𝐞</strong><p>A focused home for useful software.</p></div></div>
      <div className="footer-columns"><div><span>Store</span><Link to="/">All apps</Link><Link to="/about">Developer</Link></div><div><span>Connect</span>{links.map(([key,url]) => <a key={key} href={url} target="_blank" rel="noreferrer">{key}</a>)}{developer.email && <a href={`mailto:${developer.email}`}>Email</a>}</div></div>
    </div>
    <div className="container site-footer__bottom"><span>© {new Date().getFullYear()} {developer.name}. All rights reserved.</span><span>𝐒𝐑𝐊 𝐒𝐨𝐟𝐭 𝐒𝐭𝐨𝐫𝐞 · Apps provided as-is</span></div>
  </footer>
}
