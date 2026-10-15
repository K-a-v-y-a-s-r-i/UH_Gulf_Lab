import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const HARRIS_COUNTY_CENTER = [-95.4, 29.9];

function toGeoJSON(projects) {
  return {
    type: 'FeatureCollection',
    features: projects
      .filter((p) => p.lat != null && p.lon != null)
      .map((p) => ({
        type: 'Feature',
        id: p.parcel_id,
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: p,
      })),
  };
}

export default function MapView({ projects, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: HARRIS_COUNTY_CENTER,
      zoom: 9,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource('projects', {
        type: 'geojson',
        data: toGeoJSON([]),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Clustered bubble
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'projects',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#60a5fa',
          'circle-radius': ['step', ['get', 'point_count'], 14, 25, 20, 100, 28, 750, 36],
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Count label on each cluster
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'projects',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual points (only shown once zoomed in past clusterMaxZoom)
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'projects',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['step', ['get', 'confidence_count'], 3, 2, 5, 3, 7],
          'circle-color': ['step', ['get', 'confidence_count'], '#cccccc', 2, '#f59e0b', 3, '#dc2626'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.85,
        },
      });

      // Click a cluster → zoom in to expand it
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('projects').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // Click an individual point → select it (shows in sidebar)
      map.on('click', 'unclustered-point', (e) => onSelect(e.features[0].properties.parcel_id));

      ['clusters', 'unclustered-point'].forEach((layer) => {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => map.getSource('projects')?.setData(toGeoJSON(projects));
    if (map.isStyleLoaded() && map.getSource('projects')) update();
    else map.once('load', update);
  }, [projects]);

  useEffect(() => {
    const project = projects.find((p) => p.parcel_id === selectedId);
    if (project && mapRef.current) {
      mapRef.current.flyTo({ center: [project.lon, project.lat], zoom: 15 });
    }
  }, [selectedId, projects]);

  return <div ref={containerRef} className="map" />;
}