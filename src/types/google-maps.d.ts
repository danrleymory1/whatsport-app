// types/google-maps.d.ts

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      getCenter(): LatLng;
      fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      setOptions(options: MapOptions): void;
      mapTypes: MapTypeRegistry;
      controls: MVCArray<Node>[][];
      data: Data;
      overlayMapTypes: MVCArray<MapType>;
    }

    interface MapOptions {
      center: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string | MapTypeId;
      mapTypeControl?: boolean;
      mapTypeControlOptions?: MapTypeControlOptions;
      zoomControl?: boolean;
      clickableIcons?: boolean;
      gestureHandling?: string;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
    }

    enum MapTypeId {
      ROADMAP = "roadmap",
      SATELLITE = "satellite",
      HYBRID = "hybrid", 
      TERRAIN = "terrain"
    }

    interface MapTypeControlOptions {
      style?: number;
      mapTypeIds?: (string | MapTypeId)[];
    }

    class MapTypeRegistry extends MVCObject {
      set(id: string, mapType: MapType): void;
    }

    interface MapType {
      getTile(coord: Point, zoom: number, document: Document): Element;
      releaseTile(tile: Element): void;
      tileSize: Size;
      maxZoom?: number;
      minZoom?: number;
      name?: string;
      alt?: string;
    }

    interface MVCArray<T> {
      clear(): void;
      getArray(): T[];
      getAt(i: number): T;
      getLength(): number;
      insertAt(i: number, elem: T): void;
      pop(): T;
      push(elem: T): number;
      removeAt(i: number): T;
      setAt(i: number, elem: T): void;
    }

    class MVCObject {
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    interface MapsEventListener {
      remove(): void;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      equals(other: LatLng): boolean;
      toString(): string;
      toUrlValue(precision?: number): string;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      isEmpty(): boolean;
      getCenter(): LatLng;
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
      equals(other: LatLngBounds | LatLngBoundsLiteral): boolean;
    }

    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
      equals(other: Point): boolean;
      toString(): string;
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
      equals(other: Size): boolean;
      toString(): string;
    }

    interface Padding {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map: Map, anchor?: MVCObject | Element): void;
      close(): void;
      setContent(content: string | Element): void;
      getContent(): string | Element;
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null;
      setZIndex(zIndex: number): void;
      getZIndex(): number;
    }

    interface InfoWindowOptions {
      content?: string | Element;
      disableAutoPan?: boolean;
      maxWidth?: number;
      pixelOffset?: Size;
      position?: LatLng | LatLngLiteral;
      zIndex?: number;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setPosition(position: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null;
      setTitle(title: string): void;
      getTitle(): string;
      setIcon(icon: string | Icon | Symbol): void;
      getIcon(): string | Icon | Symbol;
      setMap(map: Map | null): void;
      getMap(): Map | null;
      setVisible(visible: boolean): void;
      getVisible(): boolean;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
      draggable?: boolean;
      animation?: Animation;
      visible?: boolean;
      zIndex?: number;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      size?: Size;
      origin?: Point;
      anchor?: Point;
    }

    interface Symbol {
      path: string | number;
      fillColor?: string;
      fillOpacity?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    enum Animation {
      BOUNCE = 1,
      DROP = 2
    }

    class DistanceMatrixService {
      getDistanceMatrix(
        request: DistanceMatrixRequest,
        callback: (response: DistanceMatrixResponse, status: string) => void
      ): void;
    }

    interface DistanceMatrixRequest {
      origins: (string | LatLng | LatLngLiteral)[];
      destinations: (string | LatLng | LatLngLiteral)[];
      travelMode: TravelMode;
      avoidHighways?: boolean;
      avoidTolls?: boolean;
    }

    interface DistanceMatrixResponse {
      rows: DistanceMatrixResponseRow[];
    }

    interface DistanceMatrixResponseRow {
      elements: DistanceMatrixResponseElement[];
    }

    interface DistanceMatrixResponseElement {
      status: string;
      distance: {value: number; text: string};
    }

    enum TravelMode {
      DRIVING = "DRIVING",
      BICYCLING = "BICYCLING",
      TRANSIT = "TRANSIT",
      WALKING = "WALKING"
    }

    class Data {
      setStyle(style: any): void;
      addGeoJson(geoJson: any): any;
    }

    namespace event {
      function addListenerOnce(instance: any, eventName: string, handler: Function): MapsEventListener;
    }
  }
}