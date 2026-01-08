import Dexie, { Table } from 'dexie'

export interface CachedData {
  id: string
  table: string
  data: any
  timestamp: number
}

class AppDatabase extends Dexie {
  budgets!: Table<any, string>
  expenses!: Table<any, string>
  okrs!: Table<any, string>
  keyResults!: Table<any, string>
  kpis!: Table<any, string>
  cache!: Table<CachedData, string>

  constructor() {
    super('NexusDB')
    this.version(1).stores({
      budgets: 'id, client_id, created_at',
      expenses: 'id, budget_id, created_at',
      okrs: 'id, quarter, year, owner_id',
      keyResults: 'id, okr_id',
      kpis: 'id, category',
      cache: 'id, table, timestamp'
    })
  }

  async getCached(table: string, id: string, maxAge: number = 5 * 60 * 1000) {
    const cached = await this.cache.get(`${table}-${id}`)
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data
    }
    return null
  }

  async setCache(table: string, id: string, data: any) {
    await this.cache.put({
      id: `${table}-${id}`,
      table,
      data,
      timestamp: Date.now()
    })
  }

  async clearOldCache(maxAge: number = 10 * 60 * 1000) {
    const cutoff = Date.now() - maxAge
    await this.cache.where('timestamp').below(cutoff).delete()
  }
}

export const db = new AppDatabase()

// Auto-cleanup old cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    db.clearOldCache()
  }, 10 * 60 * 1000)
}
