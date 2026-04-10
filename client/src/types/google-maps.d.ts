/// <reference types="google.maps" />

declare namespace google {
  namespace maps {
    interface MapTypeStyle {
      elementType?: string;
      featureType?: string;
      stylers?: Array<{ [key: string]: string | number | boolean }>;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
      animation?: Animation;
      clickable?: boolean;
    }

    interface Icon {
      url: string;
      size?: Size;
      origin?: Point;
      anchor?: Point;
      scaledSize?: Size;
    }

    interface Symbol {
      path: SymbolPath | string;
      fillColor?: string;
      fillOpacity?: number;
      scale?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    enum SymbolPath {
      CIRCLE = 0,
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface Size {
      height: number;
      width: number;
    }

    interface Point {
      x: number;
      y: number;
    }

    enum Animation {
      BOUNCE = 1,
      DROP = 2,
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      styles?: MapTypeStyle[];
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
      mapTypeControl?: boolean;
    }

    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng | LatLngLiteral): void;
      addListener(eventName: string, callback: () => void): void;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map: Map, anchor?: Marker): void;
      close(): void;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      position?: LatLng | LatLngLiteral;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): void;
      contains(point: LatLng | LatLngLiteral): boolean;
    }
  }
}
