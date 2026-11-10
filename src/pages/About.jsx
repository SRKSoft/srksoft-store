import { Link } from 'react-router-dom'
import developer from '../data/developer.json'
import apps from '../data/apps.json'
import AppCard from '../components/AppCard.jsx'
import useSEO from '../hooks/useSEO.js'

export default function About() {
  useSEO({
    title: 'About SRK Soft – Developer of SRK Soft Store',
    description: 'Meet the developer behind SRK Soft Store and browse the apps published by SRK Soft, with direct downloads from official releases.',
    path: '/about',
  })

  const links = Object.entries(developer.socials || {}).filter(([,url]) => url)
  return <main className="about-page">
    <section className="about-hero"><div className="container about-hero__inner">
      <div className="about-profile"><div className="about-photo-wrap"><img src={developer.photo} alt={developer.name} /></div><div><span className="section-kicker">⋆˚｡⋆✧˚  𝑭𝑶𝑼𝑵𝑫𝑬𝑹 & 𝑳𝑬𝑨𝑫 𝑫𝑬𝑽𝑬𝑳𝑶𝑷𝑬𝑹  ˚✧⋆｡˚⋆</span><h1>{developer.name}</h1><p>{developer.bio}</p><div className="about-location">{developer.location}</div></div></div>
      <div className="about-links">{links.map(([key,url]) => <a key={key} href={url} target="_blank" rel="noreferrer" className="button button--soft">{key}</a>)}{developer.email && <a href={`mailto:${developer.email}`} className="button button--primary">Contact</a>}</div>
    </div></section>
    <section className="container about-content"><div className="section-heading"><div><span className="section-kicker">Published software</span><h2>Apps</h2></div><Link to="/" className="about-back">Back to store →</Link></div><div className="app-grid">{apps.map((app,i) => <AppCard key={app.id} app={app} index={i}/>)}</div></section>
  </main>
}