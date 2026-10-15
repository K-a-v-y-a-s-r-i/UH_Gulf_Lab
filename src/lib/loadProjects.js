import { supabase } from './supabaseClient'

const COLUMNS =
  'parcel_id, status, data_sources, confidence_count, subdivision, address, zipcode, new_construction_val, saledate, owner, plat_app_no, plat_status, lat, lon'
const PAGE = 1000

export async function loadProjects() {
  try {
    let all = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('development_parcels')
        .select(COLUMNS)
        .order('parcel_id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      all = all.concat(data)
      if (data.length < PAGE) break
    }
    if (all.length > 0) return all
    throw new Error('No rows returned')
  } catch (e) {
    console.warn('Supabase load failed, using sample data:', e)
    const res = await fetch('/sample-projects.json')
    return res.json()
  }
}