
// src/types/global.d.ts

// Declaração global para o objeto Leaflet
declare global {
  interface Window {
    L: any;
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    };
  }
}
  
export {};