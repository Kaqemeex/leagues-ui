import { useLeague } from '../contexts/LeagueContext'
import { useUserState } from '../hooks/useUserState'
import { loadLeagues } from '../lib/data'

export function SettingsPage() {
  const { setSelectedLeagueId } = useLeague()
  const { state, setCharacterName, setPreference, setSelectedLeague, resetProgress } = useUserState()
  const leagues = loadLeagues()

  function handleLeagueChange(id: string) {
    setSelectedLeague(id)
    setSelectedLeagueId(id)
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">League</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="league-select" className="text-sm text-gray-600">Active league</label>
          <select
            id="league-select"
            value={state.selectedLeagueId}
            onChange={e => handleLeagueChange(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Character</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="character-name" className="text-sm text-gray-600">Character name</label>
          <input
            id="character-name"
            type="text"
            value={state.preferences.characterName}
            onChange={e => setCharacterName(e.target.value)}
            placeholder="Enter character name"
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label htmlFor="show-completed-on-map" className="text-sm text-gray-600">
              Show completed on map
            </label>
            <input
              id="show-completed-on-map"
              type="checkbox"
              checked={state.preferences.showCompletedOnMap}
              onChange={e => setPreference('showCompletedOnMap', e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data</h2>
        <button
          onClick={() => {
            if (confirm('Reset all progress? This will clear completed tasks, task lists, and route plans.')) {
              resetProgress()
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Reset all progress
        </button>
      </section>
    </div>
  )
}
