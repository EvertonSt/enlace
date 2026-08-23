import { useEffect, useRef } from 'react';
import L from 'leaflet';
import i18n from 'i18next';
import type { OutageEvent } from '@enlace/core';

// Fix Leaflet default icon paths for Vite bundling
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const STATUS_COLORS: Record<string, string> = {
  reported: '#f59e0b',
  investigating: '#ef4444',
  identified: '#f97316',
  fix_in_progress: '#3b82f6',
  resolved: '#22c55e',
};


const AREA_COORDS: Record<string, [number, number]> = {
  'Centro, Paripiranga (BA)': [-10.6833, -37.8667],
  'Lagoa Preta, Paripiranga (BA)': [-10.6900, -37.8750],
  'Centro': [-10.6833, -37.8667],
  'Lagoa Preta': [-10.6900, -37.8750],
  'Baixa Verde, Paripiranga (BA)': [-10.6750, -37.8580],
  'Novo Horizonte, Paripiranga (BA)': [-10.6950, -37.8800],
};

function getCoords(outage: OutageEvent): [number, number] {
  const exact = AREA_COORDS[outage.affectedArea];
  if (exact) return exact;

  const keys = Object.keys(AREA_COORDS);
  for (const key of keys) {
    const neighborhood = key.split(',')[0];
    if (neighborhood && outage.affectedArea.includes(neighborhood)) {
      return AREA_COORDS[key]!;
    }
  }

  const hash = outage.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return [-10.6833 + (hash % 20) * 0.003, -37.8667 + (hash % 15) * 0.003];
}

/**
 * Creates a pulsing ring marker for active outages, solid dot for resolved.
 */
function createMarkerIcon(color: string, isActive: boolean): L.DivIcon {
  if (!isActive) {
    return L.divIcon({
      className: 'outage-marker',
      html: `
        <div style="
          width: 22px; height: 22px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        "></div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  return L.divIcon({
    className: 'outage-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing ring -->
        <div style="
          position: absolute;
          width: 36px; height: 36px;
          border: 2px solid ${color};
          border-radius: 50%;
          opacity: 0.4;
          animation: outage-pulse 2s ease-in-out infinite;
        "></div>
        <!-- Solid center dot -->
        <div style="
          width: 16px; height: 16px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

interface OutageMapProps {
  outages: OutageEvent[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  showResolved?: boolean;
}

export default function OutageMap({
  outages,
  height = '500px',
  center = [-10.6833, -37.8667] as [number, number],
  zoom = 12,
  showResolved = false,
}: OutageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Inject pulse animation CSS
    if (!document.getElementById('outage-map-styles')) {
      const style = document.createElement('style');
      style.id = 'outage-map-styles';
      style.textContent = `
        @keyframes outage-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .dark .leaflet-popup-content-wrapper {
          background: #1f2937 !important;
          color: #f3f4f6 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
        }
        .dark .leaflet-popup-tip { background: #1f2937 !important; }
      `;
      document.head.appendChild(style);
    }

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Light tiles
    const lightTiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      },
    );

    // Dark tiles (CartoDB Dark Matter)
    const darkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      },
    );

    // Pick tiles based on dark mode
    const isDark = document.documentElement.classList.contains('dark');
    const activeTiles = isDark ? darkTiles : lightTiles;
    activeTiles.addTo(map);

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      if (dark && map.hasLayer(lightTiles)) {
        map.removeLayer(lightTiles);
        darkTiles.addTo(map);
      } else if (!dark && map.hasLayer(darkTiles)) {
        map.removeLayer(darkTiles);
        lightTiles.addTo(map);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    mapInstanceRef.current = map;

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = showResolved
      ? outages
      : outages.filter((o) => o.status !== 'resolved');

    filtered.forEach((outage) => {
      const coords = getCoords(outage);
      const color = STATUS_COLORS[outage.status] ?? '#6b7280';
      const isActive = outage.status !== 'resolved';
      const icon = createMarkerIcon(color, isActive);
      const marker = L.marker(coords, { icon }).addTo(map);

      const statusLabelKey = outage.status === 'fix_in_progress' ? 'outage.fixInProgress' : 'outage.' + outage.status;
      const statusLabel = i18n.t(statusLabelKey);
      marker.bindPopup(`
        <div style="min-width: 220px; font-family: system-ui, sans-serif; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">
            ${outage.title}
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            ${outage.description ?? ''}
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px;">
            <span style="
              background: ${color}20;
              color: ${color};
              padding: 2px 8px;
              border-radius: 9999px;
              font-weight: 600;
            ">${statusLabel}</span>
            <span style="color: #6b7280;">
              👥 ${i18n.t("outage.affectedCustomers", { count: outage.affectedCustomerCount.toLocaleString() })}
            </span>
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #9ca3af;">
            📍 ${outage.affectedArea}
          </div>
          ${outage.estimatedResolution ? `
            <div style="margin-top: 4px; font-size: 11px; color: #9ca3af;">
              ⏱️ ${i18n.t('outage.estimatedResolution')}: ${new Date(outage.estimatedResolution).toLocaleTimeString()}
            </div>
          ` : ''}
        </div>
      `);

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 1) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [outages, showResolved]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '12px' }}
      className="z-0"
    />
  );
}
