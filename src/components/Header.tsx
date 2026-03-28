import { Link, NavLink } from 'react-router-dom'
import { useLeague } from '../contexts/LeagueContext'
import { useFilter } from '../contexts/FilterContext'

export function Header() {
  const { leagues, selectedLeagueId, setSelectedLeagueId } = useLeague()
  const { filters, setSearch } = useFilter()
  return (
    <header className="flex items-center gap-4 px-4 py-2 bg-gray-900 text-white">
      <Link to="/" className="font-bold text-lg whitespace-nowrap">Leagues Planner</Link>
      <select
        value={selectedLeagueId}
        onChange={e => setSelectedLeagueId(e.target.value)}
        className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
      >
        {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <input
        type="search"
        placeholder="Search tasks…"
        value={filters.searchQuery}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-sm"
      />
      <span className="text-sm bg-yellow-600 rounded px-2 py-1">0 pts</span>
      <nav className="flex gap-3 text-sm">
        {[
          { to: '/tasks', label: 'Tasks' },
          { to: '/map', label: 'Map' },
          { to: '/planner', label: 'Planner' },
          { to: '/track', label: 'Tracker' },
          { to: '/settings', label: 'Settings' },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'underline' : ''}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
