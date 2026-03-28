import { useState } from 'react'
import { useUserState } from '../hooks/useUserState.js'
import { useLeague } from '../contexts/LeagueContext.js'
import { loadLeague } from '../lib/data.js'
import type { Task } from '../schemas/index.js'

export function TaskListPanel() {
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
    <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-zinc-700 p-4 flex flex-col gap-3">
      <h2 className="font-semibold text-sm uppercase text-zinc-400 tracking-wide">
        Task Lists
      </h2>

      {/* New list input */}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-zinc-600 rounded px-2 py-1 text-sm bg-zinc-800 text-zinc-100 placeholder-zinc-500"
          placeholder="New list name…"
          value={newListName}
          onChange={e => setNewListName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button
          className="border border-zinc-600 rounded px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
          onClick={handleCreate}
        >
          + New list
        </button>
      </div>

      {state.taskLists.length === 0 && (
        <p className="text-zinc-500 text-sm">No lists yet. Create one above.</p>
      )}

      {/* List of existing task lists */}
      {state.taskLists.map(list => (
        <div key={list.id} className="border border-zinc-700 rounded">
          {/* List header row */}
          <div className="flex items-center gap-2 p-2">
            {renamingId === list.id ? (
              <input
                className="flex-1 border border-zinc-600 rounded px-2 py-0.5 text-sm bg-zinc-800 text-zinc-100"
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
                className="flex-1 text-left text-sm font-medium text-zinc-100 hover:underline"
                onClick={() => handleOpenList(list.id)}
              >
                {list.name}
                <span className="ml-2 text-zinc-500 font-normal">
                  ({list.taskIds.length} task{list.taskIds.length !== 1 ? 's' : ''})
                </span>
              </button>
            )}
            <button
              className="text-xs text-zinc-500 hover:text-zinc-300 px-1"
              title="Rename"
              onClick={() => handleStartRename(list.id, list.name)}
            >
              ✏️
            </button>
            <button
              className="text-xs text-red-400 hover:text-red-300 px-1"
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
                  ? 'text-blue-400 font-semibold'
                  : 'text-zinc-500 hover:text-blue-400'
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
            <div className="border-t border-zinc-700 p-2 flex flex-col gap-2">
              {/* Tasks in list */}
              {list.taskIds.length === 0 ? (
                <p className="text-zinc-500 text-xs">No tasks in this list.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {list.taskIds.map(taskId => {
                    const task = taskById[taskId]
                    return (
                      <li
                        key={taskId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate text-zinc-200">
                          {task ? task.name : taskId}
                        </span>
                        <button
                          className="ml-2 text-xs text-red-400 hover:text-red-300 shrink-0"
                          onClick={() => removeTaskFromList(list.id, taskId)}
                        >
                          ✕
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Add tasks section */}
              <div className="border-t border-zinc-700 pt-2 flex flex-col gap-1">
                <p className="text-xs text-zinc-500 font-medium">+ Add tasks</p>
                <input
                  className="border border-zinc-600 rounded px-2 py-1 text-xs bg-zinc-800 text-zinc-100 placeholder-zinc-500"
                  placeholder="Search tasks…"
                  value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                />
                <ul className="max-h-40 overflow-y-auto flex flex-col gap-1">
                  {availableToAdd.length === 0 && (
                    <li className="text-xs text-zinc-500">
                      {addSearch ? 'No matching tasks.' : 'All tasks already added.'}
                    </li>
                  )}
                  {availableToAdd.map(task => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate text-zinc-300">{task.name}</span>
                      <button
                        className="ml-2 text-blue-400 hover:text-blue-300 shrink-0"
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
  )
}
