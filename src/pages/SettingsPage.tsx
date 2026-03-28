import { useLeague } from '../contexts/LeagueContext'

export function SettingsPage() {
  const { leagues, selectedLeagueId, setSelectedLeagueId } = useLeague()

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">League</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="league-select" className="text-sm text-gray-600">Active league</label>
          <select
            id="league-select"
            value={selectedLeagueId}
            onChange={e => setSelectedLeagueId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Show completed tasks</label>
            <input type="checkbox" className="w-4 h-4" disabled />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Dark mode</label>
            <input type="checkbox" className="w-4 h-4" disabled />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Compact task list</label>
            <input type="checkbox" className="w-4 h-4" disabled />
          </div>
        </div>
        <p className="text-xs text-gray-400">Preferences are not saved yet.</p>
      </section>
    </div>
  )
}
