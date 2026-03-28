import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLeague } from '../contexts/LeagueContext'
import { useFilter } from '../contexts/FilterContext'

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedLeagueId, setSelectedLeagueId } = useLeague()
  const { filters, toggleRegion } = useFilter()

  // On mount: read URL params and apply to state
  useEffect(() => {
    const league = searchParams.get('league')
    if (league && league !== selectedLeagueId) setSelectedLeagueId(league)
    const regions = searchParams.get('regions')
    if (regions) {
      regions
        .split(',')
        .filter(Boolean)
        .forEach(r => {
          if (!filters.activeRegions.has(r)) toggleRegion(r)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  // On state change: update URL params
  useEffect(() => {
    const params: Record<string, string> = {}
    if (selectedLeagueId !== 'sample') params.league = selectedLeagueId
    if (filters.activeRegions.size > 0)
      params.regions = Array.from(filters.activeRegions).join(',')
    setSearchParams(params, { replace: true })
  }, [selectedLeagueId, filters.activeRegions, setSearchParams])
}
