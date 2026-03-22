import { LeagueSchema } from './index.js'
import sampleData from '../../data/leagues/sample.json' assert { type: 'json' }

const result = LeagueSchema.safeParse(sampleData)
if (!result.success) { console.error(result.error); process.exit(1) }
console.log('sample.json is valid')
