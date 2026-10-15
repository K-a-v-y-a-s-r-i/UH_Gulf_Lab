import { supabase } from './supabase.js';

// Loads data center projects. Tries Supabase first, then falls back to the
// bundled sample file so the app still runs without database credentials.
export async function loadProjects() {
  if (supabase) {
    const { data, error } = await supabase
      .from('development_parcels')
      .select('parcel_id, status, data_sources, confidence_count, subdivision, address, zipcode, new_construction_val, saledate, owner, plat_app_no, plat_status, lat, lon')
      .order('parcel_id', { ascending: true })
      .limit(5000);
    if (!error) return { projects: data, source: 'supabase' };
    console.warn('Supabase query failed, using sample data:', error.message);
  }

  const response = await fetch('/sample-projects.json');
  return { projects: await response.json(), source: 'sample' };
}