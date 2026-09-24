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

const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving';
const ROUTE_CACHE_PREFIX = 'cafenav_osrm_route_';

function routeKey(start: [number, number], end: [number, number]) {
  return `${ROUTE_CACHE_PREFIX}${start[0].toFixed(4)}_${start[1].toFixed(4)}_${end[0].toFixed(4)}_${end[1].toFixed(4)}`;
}

function isValidCoordinate(coordinate: [number, number]) {
  return (
    Number.isFinite(coordinate[0]) &&
    Number.isFinite(coordinate[1]) &&
    Math.abs(coordinate[0]) <= 180 &&
    Math.abs(coordinate[1]) <= 90
  );
}

export function getCachedDirections(start: [number, number], end: [number, number]): OsrmRoute | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(routeKey(start, end));
    if (!cached) return null;
    const parsed = JSON.parse(cached) as OsrmRoute;
    return parsed?.geometry?.coordinates?.length ? parsed : null;
  } catch {
    return null;
  }
}

function cacheDirections(start: [number, number], end: [number, number], route: OsrmRoute) {
  try {
    localStorage.setItem(routeKey(start, end), JSON.stringify({ ...route, cachedAt: Date.now() }));
  } catch {
    // Optional caching fallback
  }
}

export async function getDirections(
  start: [number, number],
  end: [number, number],
  timeoutMs = 8000
): Promise<OsrmRoute> {
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    throw new Error('Invalid map coordinates');
  }

  // 1. Check local storage cache first
  const cached = getCachedDirections(start, end);
  if (cached) {
    return cached;
  }

  // 2. If browser is offline, throw error immediately to trigger CafeMap fallback
  if (typeof window !== 'undefined' && !navigator.onLine) {
    throw new Error('Network offline');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const url = `${OSRM_ENDPOINT}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`OSRM request failed with status ${response.status}`);
    
    const data = (await response.json()) as OsrmResponse;
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
      throw new Error(`OSRM returned ${data.code || 'no route'}`);
    }

    cacheDirections(start, end, data.routes[0]);
    return data.routes[0];
  } catch (error) {
    console.warn('[CafeNav] Directions network fetch failed, using fallback:', error);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}