export interface MapOptions {
  mapUrl: string;
  groundUrl: string;
  code: string; // 地区码
  debug?: boolean;
  width: number;
  height: number;
  camera: number[]; // 相机位置
  depth: number; // 地图厚度
  sideColor: string; // 侧边颜色
  textColor?: string;
  fillColor?: string;
  adcode: number;
  actives: number[];
  lightIntensity?: number; // light intensity default 1.8
  onClick?: (adcode: GeoJsonProperties) => void;
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
