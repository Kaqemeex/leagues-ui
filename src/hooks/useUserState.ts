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
}))
