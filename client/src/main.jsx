
import React from 'react'
import ReactDOM from 'react-dom/client'
import WallTile from './WallTile'
import './styles.css'

const REPORT_ID = import.meta.env.VITE_REPORT_ID
const PAGES = [
  import.meta.env.VITE_PAGE_1 || 'Curva S',
  import.meta.env.VITE_PAGE_2 || 'Atividades Visão Geral',
  import.meta.env.VITE_PAGE_3 || 'Aderência a Programação',
  import.meta.env.VITE_PAGE_4 || 'GV UVT',
  import.meta.env.VITE_PAGE_5 || 'Planejamento Entressafra',
  import.meta.env.VITE_PAGE_6 || 'Programação Semanal'
]

function Wall() {
  return (
    <div className="wall">
      {PAGES.map((page, idx) => (
        <WallTile key={idx} reportId={REPORT_ID} pageDisplayName={page} />
      ))}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Wall />
  </React.StrictMode>
)
