export const cafeCoordinates: Record<string, { lat: number; lng: number }> = {
  "Brew Co.": { lat: 14.2120, lng: 121.1630 },
  "Brew and Co.": { lat: 14.2120, lng: 121.1630 },
  "The Elements": { lat: 14.2130, lng: 121.1650 },
  "Grind. Coffee": { lat: 14.2144, lng: 121.1627 },
  "Usual Coffee": { lat: 14.2114, lng: 121.1648 },
  "250 Cafe": { lat: 14.2116, lng: 121.1644 },
  "Bo's Coffee": { lat: 14.1950, lng: 121.1730 },
  "The Outdoor Cafe": { lat: 14.1985, lng: 121.1712 },
  "Psalm 23:5 Coffee": { lat: 14.2020, lng: 121.1680 },
  "Beanstalk Cafe": { lat: 14.2095, lng: 121.1560 },
  "OG's Brew Cafe": { lat: 14.2050, lng: 121.1610 },
  "Wraps Coffee": { lat: 14.2100, lng: 121.1635 },
  "Champoccino": { lat: 14.2080, lng: 121.1600 },
  "For:": { lat: 14.2110, lng: 121.1620 },
  "Moonbucks Coffee Shop": { lat: 14.2070, lng: 121.1590 },
  "The Sifted Cafe": { lat: 14.2150, lng: 121.1660 },
  "Dose Dos Cafe": { lat: 14.2125, lng: 121.1640 },
  "Roastd.": { lat: 14.2140, lng: 121.1615 }
};

export const defaultCenter = { lat: 14.2114, lng: 121.1648 };

// Calculate distance in meters using Haversine formula
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
