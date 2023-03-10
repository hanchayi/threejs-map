export interface MapOptions {
  mapUrl: string;
  groundUrl: string;
  locationUrl: string;
  locations: Location[];
  debug?: boolean;
  width: number;
  height: number;
  cameraX: number; // camera postion x
  cameraY: number; // camera postion y
  cameraZ: number; // camera postion z
  depth: number; // 地图厚度
  adcode: number;
  actives: number[];
  lightIntensity?: number; // light intensity default 1.8
  onClick?: (adcode: GeoJsonProperties) => void;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface GeoJson {  // 地图数据
  properties: GeoJsonProperties;
  features: Array<{
    properties: GeoJsonProperties,
    geometry: {
      coordinates: Coordinate[]
    }
  }>;
  geometry: {
    coordinates: Coordinate[]
  }
};

export interface GeoJsonProperties {
  name: string;
  adcode: number;
  center: number[];
  level: string;
}

export type Coordinate = Array<Array<number[]>>
