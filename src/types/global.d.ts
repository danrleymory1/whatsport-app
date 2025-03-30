// src/types/global.d.ts

// Declaração global para o objeto tomtom
declare global {
    interface Window {
      tomtom?: {
        L: {
          map: (element: HTMLElement, options: any) => any;
          featureGroup: () => any;
          marker: (coordinates: [number, number], options?: any) => any;
          icon: (options: any) => any;
        };
      };
    }
  }
  
  export {};