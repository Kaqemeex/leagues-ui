export function PlannerPage() {
  return (
    <div className="flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      {/* Task list — left column */}
      <aside className="w-80 border rounded p-4 flex flex-col gap-2">
        <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">Task List</h2>
        <p className="text-gray-400 text-sm">No tasks selected.</p>
      </aside>

      {/* Map — right column */}
      <div className="flex-1 border rounded flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-lg">Map placeholder</p>
      </div>
    </div>
  )
}
