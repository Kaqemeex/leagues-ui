import { useState } from 'react'
import { useUserState } from '../hooks/useUserState.js'
import { useLeague } from '../contexts/LeagueContext.js'
import { loadLeague } from '../lib/data.js'
import type { Task } from '../schemas/index.js'

export function PlannerPage() {
  const {
    state,
    createTaskList,
    deleteTaskList,
    addTaskToList,
    removeTaskFromList,
    renameTaskList,
    setActiveTaskList,
  } = useUserState()

  const { selectedLeagueId } = useLeague()
  const league = loadLeague(selectedLeagueId)
  const allTasks: Task[] = league?.tasks ?? []

  const [newListName, setNewListName] = useState('')
  const [openListId, setOpenListId] = useState<string | null>(null)
  const [addSearch, setAddSearch] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const taskById = Object.fromEntries(allTasks.map(t => [t.id, t]))

  const openList = state.taskLists.find(l => l.id === openListId) ?? null

  const availableToAdd: Task[] = openList
    ? allTasks.filter(
        t =>
          !openList.taskIds.includes(t.id) &&
          (addSearch === '' || t.name.toLowerCase().includes(addSearch.toLowerCase())),
      )
    : []

  function handleCreate() {
    const trimmed = newListName.trim()
    if (!trimmed) return
    createTaskList(trimmed)
    setNewListName('')
  }

  function handleOpenList(id: string) {
    setOpenListId(prev => (prev === id ? null : id))
    setAddSearch('')
  }

  function handleStartRename(id: string, currentName: string) {
    setRenamingId(id)
    setRenameValue(currentName)
  }

  function handleCommitRename(id: string) {
    const trimmed = renameValue.trim()
    if (trimmed) renameTaskList(id, trimmed)
    setRenamingId(null)
    setRenameValue('')
  }

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      {/* Task lists panel — left column */}
      <aside className="w-80 border rounded p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">
          Task Lists
        </h2>

        {/* New list input */}
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="New list name…"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            className="border rounded px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>

        {state.taskLists.length === 0 && (
          <p className="text-gray-400 text-sm">No lists yet. Create one above.</p>
        )}

        {/* List of existing task lists */}
        {state.taskLists.map(list => (
          <div key={list.id} className="border rounded">
            {/* List header row */}
            <div className="flex items-center gap-2 p-2">
              {renamingId === list.id ? (
                <input
                  className="flex-1 border rounded px-2 py-0.5 text-sm"
                  value={renameValue}
                  autoFocus
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleCommitRename(list.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCommitRename(list.id)
                    if (e.key === 'Escape') {
                      setRenamingId(null)
                      setRenameValue('')
                    }
                  }}
                />
              ) : (
                <button
                  className="flex-1 text-left text-sm font-medium hover:underline"
                  onClick={() => handleOpenList(list.id)}
                >
                  {list.name}
                  <span className="ml-2 text-gray-400 font-normal">
                    ({list.taskIds.length} task{list.taskIds.length !== 1 ? 's' : ''})
                  </span>
                </button>
              )}
              <button
                className="text-xs text-gray-400 hover:text-gray-700 px-1"
                title="Rename"
                onClick={() => handleStartRename(list.id, list.name)}
              >
                ✏️
              </button>
              <button
                className="text-xs text-red-400 hover:text-red-600 px-1"
                title="Delete list"
                onClick={() => {
                  if (openListId === list.id) setOpenListId(null)
                  deleteTaskList(list.id)
                }}
              >
                ✕
              </button>
              <button
                className={`text-xs px-1 ${
                  state.activeTaskListId === list.id
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-400 hover:text-blue-500'
                }`}
                title={
                  state.activeTaskListId === list.id ? 'Active list' : 'Set as active'
                }
                onClick={() =>
                  setActiveTaskList(
                    state.activeTaskListId === list.id ? undefined : list.id,
                  )
                }
              >
                {state.activeTaskListId === list.id ? '★' : '☆'}
              </button>
            </div>

            {/* Inline expanded panel */}
            {openListId === list.id && (
              <div className="border-t p-2 flex flex-col gap-2">
                {/* Tasks in list */}
                {list.taskIds.length === 0 ? (
                  <p className="text-gray-400 text-xs">No tasks in this list.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {list.taskIds.map(taskId => {
                      const task = taskById[taskId]
                      return (
                        <li
                          key={taskId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate">
                            {task ? task.name : taskId}
                          </span>
                          <button
                            className="ml-2 text-xs text-red-400 hover:text-red-600 shrink-0"
                            onClick={() => removeTaskFromList(list.id, taskId)}
                          >
                            Remove
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Add tasks section */}
                <div className="border-t pt-2 flex flex-col gap-1">
                  <p className="text-xs text-gray-500 font-medium">Add tasks</p>
                  <input
                    className="border rounded px-2 py-1 text-xs"
                    placeholder="Search tasks…"
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                  />
                  <ul className="max-h-40 overflow-y-auto flex flex-col gap-1">
                    {availableToAdd.length === 0 && (
                      <li className="text-xs text-gray-400">
                        {addSearch ? 'No matching tasks.' : 'All tasks already added.'}
                      </li>
                    )}
                    {availableToAdd.map(task => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="truncate">{task.name}</span>
                        <button
                          className="ml-2 text-blue-500 hover:text-blue-700 shrink-0"
                          onClick={() => addTaskToList(list.id, task.id)}
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* Map placeholder — right column */}
      <div className="flex-1 border rounded flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-lg">Map placeholder</p>
      </div>
    </div>
  )
}
