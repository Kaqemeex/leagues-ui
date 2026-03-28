import { create } from 'zustand'
import {
  deserializeUserState,
  serializeUserState,
  STORAGE_KEY,
} from '../schemas/userstate.js'
import type { UserState } from '../schemas/userstate.js'

function loadState(): UserState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown
    return deserializeUserState(raw)
  } catch {
    return deserializeUserState({})
  }
}

function saveState(state: UserState): void {
  localStorage.setItem(STORAGE_KEY, serializeUserState(state))
}

interface UserStateStore {
  state: UserState
  toggleTask: (taskId: string) => void
  setPreference: <K extends keyof UserState['preferences']>(
    key: K,
    value: UserState['preferences'][K],
  ) => void
  setCharacterName: (name: string) => void
  setSelectedLeague: (id: string) => void
  setActiveTaskList: (id: string | undefined) => void
  createTaskList: (name: string) => void
  deleteTaskList: (id: string) => void
  addTaskToList: (listId: string, taskId: string) => void
  removeTaskFromList: (listId: string, taskId: string) => void
  renameTaskList: (id: string, name: string) => void
}

export const useUserState = create<UserStateStore>()(set => ({
  state: loadState(),

  toggleTask: (taskId: string) =>
    set(store => {
      const next = new Set(store.state.completedTaskIds)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      const nextState: UserState = { ...store.state, completedTaskIds: next }
      saveState(nextState)
      return { state: nextState }
    }),

  setPreference: (key, value) =>
    set(store => {
      const nextState: UserState = {
        ...store.state,
        preferences: { ...store.state.preferences, [key]: value },
      }
      saveState(nextState)
      return { state: nextState }
    }),

  setCharacterName: (name: string) =>
    set(store => {
      const nextState: UserState = {
        ...store.state,
        preferences: { ...store.state.preferences, characterName: name },
      }
      saveState(nextState)
      return { state: nextState }
    }),

  setSelectedLeague: (id: string) =>
    set(store => {
      const nextState: UserState = { ...store.state, selectedLeagueId: id }
      saveState(nextState)
      return { state: nextState }
    }),

  setActiveTaskList: (id: string | undefined) =>
    set(store => {
      const nextState: UserState = { ...store.state, activeTaskListId: id }
      saveState(nextState)
      return { state: nextState }
    }),

  createTaskList: (name: string) =>
    set(store => {
      const now = Date.now()
      const newList = {
        id: crypto.randomUUID(),
        name,
        taskIds: [],
        createdAt: now,
        lastModified: now,
      }
      const nextState: UserState = {
        ...store.state,
        taskLists: [...store.state.taskLists, newList],
      }
      saveState(nextState)
      return { state: nextState }
    }),

  deleteTaskList: (id: string) =>
    set(store => {
      const taskLists = store.state.taskLists.filter(l => l.id !== id)
      const activeTaskListId =
        store.state.activeTaskListId === id
          ? (taskLists[0]?.id ?? undefined)
          : store.state.activeTaskListId
      const nextState: UserState = { ...store.state, taskLists, activeTaskListId }
      saveState(nextState)
      return { state: nextState }
    }),

  addTaskToList: (listId: string, taskId: string) =>
    set(store => {
      const taskLists = store.state.taskLists.map(list => {
        if (list.id !== listId) return list
        if (list.taskIds.includes(taskId)) return list
        return { ...list, taskIds: [...list.taskIds, taskId], lastModified: Date.now() }
      })
      const nextState: UserState = { ...store.state, taskLists }
      saveState(nextState)
      return { state: nextState }
    }),

  removeTaskFromList: (listId: string, taskId: string) =>
    set(store => {
      const taskLists = store.state.taskLists.map(list => {
        if (list.id !== listId) return list
        return {
          ...list,
          taskIds: list.taskIds.filter(id => id !== taskId),
          lastModified: Date.now(),
        }
      })
      const nextState: UserState = { ...store.state, taskLists }
      saveState(nextState)
      return { state: nextState }
    }),

  renameTaskList: (id: string, name: string) =>
    set(store => {
      const taskLists = store.state.taskLists.map(list => {
        if (list.id !== id) return list
        return { ...list, name, lastModified: Date.now() }
      })
      const nextState: UserState = { ...store.state, taskLists }
      saveState(nextState)
      return { state: nextState }
    }),
}))
