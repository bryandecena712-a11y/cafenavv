export interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
}

interface OsrmResponse {
  code?: string;
  routes?: OsrmRoute[];
}

const OSRM_DRIVING_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving';
const OSRM_WALKING_ENDPOINT = 'https://router.project-osrm.org/route/v1/walking';
const ROUTE_CACHE_PREFIX = 'cafenav_osrm_route_';

function routeKey(start: [number, number], end: [number, number], mode: string) {
  return `${ROUTE_CACHE_PREFIX}${mode}_${start[0].toFixed(4)}_${start[1].toFixed(4)}_${end[0].toFixed(4)}_${end[1].toFixed(4)}`;
}

function isValidCoordinate(coordinate: [number, number]) {
  return (
    Array.isArray(coordinate) &&
    coordinate.length === 2 &&
    Number.isFinite(coordinate[0]) &&
    Number.isFinite(coordinate[1]) &&
    Math.abs(coordinate[0]) <= 180 &&
    Math.abs(coordinate[1]) <= 90
  );
}

export function getCachedDirections(start: [number, number], end: [number, number], mode: string = 'driving'): OsrmRoute | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(routeKey(start, end, mode));
    if (!cached) return null;
    const parsed = JSON.parse(cached) as OsrmRoute;
    return parsed?.geometry?.coordinates?.length ? parsed : null;
  } catch {
    return null;
  }
}

function cacheDirections(start: [number, number], end: [number, number], route: OsrmRoute, mode: string = 'driving') {
  try {
    localStorage.setItem(routeKey(start, end, mode), JSON.stringify({ ...route, cachedAt: Date.now() }));
  } catch {
    // Optional local storage fallback
  }
}

export async function getDirections(
  start: [number, number],
  end: [number, number],
  timeoutMs = 8000,
  mode: 'driving' | 'walking' = 'driving'
): Promise<OsrmRoute> {
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    throw new Error('Invalid map coordinates');
  }

  const cached = getCachedDirections(start, end, mode);
  if (cached) {
    return cached;
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('Network offline');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const endpoint = mode === 'walking' ? OSRM_WALKING_ENDPOINT : OSRM_DRIVING_ENDPOINT;
  const url = `${endpoint}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`OSRM request failed with status ${response.status}`);

    const data = (await response.json()) as OsrmResponse;
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
      throw new Error(`OSRM returned ${data.code || 'no route'}`);
    }

    cacheDirections(start, end, data.routes[0], mode);
    return data.routes[0];
  } catch (error) {
    console.warn('[CafeNav] Directions request failed:', error);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function prefetchRoutes(userCoords: [number, number], cafes: any[]) {
  if (typeof window === 'undefined' || !navigator.onLine || !cafes || !Array.isArray(cafes)) return;
  if (!isValidCoordinate(userCoords)) return;

  for (const cafe of cafes) {
    try {
      const lat = parseFloat(cafe.latitude ?? cafe.lat);
      const lng = parseFloat(cafe.longitude ?? cafe.lng);

      if (isNaN(lat) || isNaN(lng)) continue;
      const endCoords: [number, number] = [lng, lat];

      if (!isValidCoordinate(endCoords)) continue;

      if (!getCachedDirections(userCoords, endCoords)) {
        await getDirections(userCoords, endCoords);
      }
    } catch {
      // Intentionally catch all prefetch errors so background requests never crash the UI
    }
  }
}