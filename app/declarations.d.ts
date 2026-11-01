declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '@phosphor-icons/react';
declare module '@phosphor-icons/react/dist/ssr';
declare module 'maplibre-gl';
declare module 'react-map-gl/maplibre';