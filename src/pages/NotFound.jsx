import { Link } from 'react-router-dom'
import useSEO from '../hooks/useSEO.js'

export default function NotFound() {
  useSEO({ title: 'Page not found | SRK Soft Store', noindex: true })
  return <main className="not-found"><div className="not-found__box"><span>404</span><h1>Page not found</h1><p>The page you're looking for doesn't exist.</p><Link to="/" className="button button--primary">Back to store <span>→</span></Link></div></main>
}