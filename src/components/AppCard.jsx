import { Link } from 'react-router-dom'

export default function AppCard({ app, index = 0, compact = false }) {
  return (
    <Link to={`/app/${app.id}`} className={`app-card ${compact ? 'app-card--compact' : ''}`} style={{ '--delay': `${Math.min(index, 8) * 55}ms` }}>
      <div className="app-card__media">
        <img src={app.icon} alt="" loading="lazy" />
        <span className="app-card__platform">{app.platform}</span>
      </div>
      <div className="app-card__body">
        <div className="app-card__eyebrow">{app.category}</div>
        <h3>{app.title}</h3>
        <p>{app.shortDescription}</p>
        <div className="app-card__bottom">
          <span><b>★</b> {app.rating ? app.rating.toFixed(1) : '0.0'}</span>
          <span>{app.size}</span>
          <span className="app-card__open">View <span>→</span></span>
        </div>
      </div>
    </Link>
  )
}
