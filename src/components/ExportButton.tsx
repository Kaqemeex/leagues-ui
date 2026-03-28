import { useState } from 'react'
import { buildRouteStops, exportToCSV, exportToText, downloadFile } from '../lib/exportRoute.js'
import { useUserState } from '../hooks/useUserState.js'
import { useLeague } from '../contexts/LeagueContext.js'
import { loadLeague } from '../lib/data.js'

export function ExportButton() {
  const [open, setOpen] = useState(false)
  const { state } = useUserState()
  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)

  const activeList = state.taskLists.find(l => l.id === state.activeTaskListId)
  if (!activeList || !league) return null

  const taskLocIndex = new Map((league.taskLocations ?? []).map(tl => [tl.taskId, tl.locationId]))
  const locIndex = new Map((league.locations ?? []).map(l => [l.id, l]))

  const stops = buildRouteStops(activeList, league.tasks, taskLocIndex, locIndex, state.completedTaskIds)

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded">
        Export ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 min-w-36">
          <button className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700"
            onClick={() => { downloadFile(exportToCSV(stops), `${activeList.name}.csv`, 'text/csv'); setOpen(false) }}>
            Export as CSV
          </button>
          <button className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700"
            onClick={() => { downloadFile(exportToText(stops), `${activeList.name}.txt`, 'text/plain'); setOpen(false) }}>
            Export as Text
          </button>
        </div>
      )}
    </div>
  )
}
