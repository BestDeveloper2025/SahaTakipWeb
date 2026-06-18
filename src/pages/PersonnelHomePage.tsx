import { Link } from 'react-router-dom'
import './PersonnelHomePage.css'

const actions = [
  {
    title: 'Uzaktan Servis',
    description: 'Müşteri için uzaktan servis kaydı oluşturun.',
    to: '/personel/uzaktan-servis',
  },
]

export function PersonnelHomePage() {
  return (
    <main className="personnel-home shell-main shell-main--wide">
      <header className="personnel-home-intro">
        <h1 className="personnel-home-title">Personel Paneli</h1>
        <p className="personnel-home-text">
          Aşağıdaki işlemlerden birini seçerek devam edin.
        </p>
      </header>

      <ul className="personnel-home-grid">
        {actions.map((action) => (
          <li key={action.to}>
            <Link className="personnel-home-card" to={action.to}>
              <h2 className="personnel-home-card-title">{action.title}</h2>
              <p className="personnel-home-card-text">{action.description}</p>
              <span className="personnel-home-card-cta">Aç</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
