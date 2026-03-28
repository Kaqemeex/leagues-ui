const TIER_THRESHOLDS = [0, 500, 1000, 2000, 3500, 5000, 7500, 10000]

interface Props {
  points: number
}

export function TierBar({ points }: Props) {
  const tier = TIER_THRESHOLDS.filter(t => points >= t).length - 1
  const nextThreshold = TIER_THRESHOLDS[tier + 1]
  const prevThreshold = TIER_THRESHOLDS[tier] ?? 0
  const progress = nextThreshold
    ? ((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100
    : 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>Tier {tier}</span>
        <span>{points.toLocaleString()} / {(nextThreshold ?? points).toLocaleString()} pts</span>
      </div>
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between">
        {TIER_THRESHOLDS.map((t, i) => (
          <div key={t} className={`text-xs ${points >= t ? 'text-amber-400 font-bold' : 'text-zinc-600'}`}>
            T{i}
          </div>
        ))}
      </div>
    </div>
  )
}
