import { supabase } from './supabase.js';

const COLUMNS =
  'parcel_id, status, data_sources, confidence_count, subdivision, address, zipcode, new_construction_val, saledate, owner, plat_app_no, plat_status, lat, lon';
const PAGE = 1000;

// Loads parcels. Tries Supabase first (all rows, fetched in pages of 1000),
// then falls back to the bundled sample file.
export async function loadProjects() {
  if (supabase) {
    let all = [];
    let failed = null;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('development_parcels')
        .select(COLUMNS)
        .order('parcel_id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        failed = error;
        break;
      }
      all = all.concat(data);
      if (data.length < PAGE) break;
    }
    if (!failed && all.length > 0) return { projects: all, source: 'supabase' };
    console.warn('Supabase query failed, using sample data:', failed && failed.message);
  }

  const response = await fetch('/sample-projects.json');
  return { projects: await response.json(), source: 'sample' };
}